import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/server/auth";
import { readNav, readWebsiteData } from "@/lib/server/store";
import { UPLOADS_DIR } from "@/lib/server/paths";

async function requireAuth(): Promise<boolean> {
	const store = await cookies();
	return !!verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * 从两个配置文件里扫出所有被引用的 /uploads/xxx 文件名。
 * 通过整体 JSON.stringify + 正则扫描，可以覆盖任意嵌套字段，
 * 包括插件 code 中的字符串引用，避免误删。
 */
function collectUsedFiles(): Set<string> {
	const nav = readNav();
	const website = readWebsiteData();
	const haystack = JSON.stringify(nav) + "\n" + JSON.stringify(website);
	// 仅匹配合法文件名字符（字母/数字/点/下划线/短横），避免把查询串、转义字符吃进去
	const re = /\/uploads\/([A-Za-z0-9._-]+)/g;
	const used = new Set<string>();
	let m: RegExpExecArray | null;
	while ((m = re.exec(haystack)) !== null) {
		used.add(m[1]);
	}
	return used;
}

function listExistingFiles(): string[] {
	if (!fs.existsSync(UPLOADS_DIR)) return [];
	return fs
		.readdirSync(UPLOADS_DIR)
		.filter((name) => {
			if (name.startsWith(".")) return false; // .gitkeep 等
			try {
				return fs.statSync(path.join(UPLOADS_DIR, name)).isFile();
			} catch {
				return false;
			}
		});
}

function computeOrphans() {
	const used = collectUsedFiles();
	const existing = listExistingFiles();
	const orphans = existing.filter((name) => !used.has(name));
	return {
		orphans,
		usedCount: existing.length - orphans.length,
		totalCount: existing.length,
	};
}

/**
 * GET：预览清理结果，不做任何删除。
 * 返回孤立文件列表与统计信息，供前端确认后再决定是否执行。
 */
export async function GET() {
	if (!(await requireAuth())) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}
	try {
		const { orphans, usedCount, totalCount } = computeOrphans();
		return NextResponse.json({
			orphans,
			used: usedCount,
			total: totalCount,
			orphanCount: orphans.length,
		});
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}

/**
 * POST：执行清理，删除所有未被配置引用的 uploads 文件。
 */
export async function POST() {
	if (!(await requireAuth())) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}
	try {
		const { orphans, totalCount } = computeOrphans();
		const deleted: string[] = [];
		const failed: { name: string; error: string }[] = [];
		for (const name of orphans) {
			const full = path.join(UPLOADS_DIR, name);
			// 二次防护：确保目标仍在 uploads 目录内，防止异常文件名越界
			const rel = path.relative(UPLOADS_DIR, full);
			if (rel.startsWith("..") || path.isAbsolute(rel)) {
				failed.push({ name, error: "路径越界" });
				continue;
			}
			try {
				fs.unlinkSync(full);
				deleted.push(name);
			} catch (e) {
				failed.push({ name, error: (e as Error).message });
			}
		}
		return NextResponse.json({
			ok: true,
			deleted,
			failed,
			deletedCount: deleted.length,
			totalBefore: totalCount,
		});
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}
