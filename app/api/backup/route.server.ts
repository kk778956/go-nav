import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/server/auth";
import {
    readNav,
    readWebsiteData,
    writeNav,
    writeWebsiteData,
} from "@/lib/server/store";
import { UPLOADS_DIR } from "@/lib/server/paths";
import { createZip, parseZip, type ZipEntry } from "@/lib/server/zip";
import type { NavConfig, WebsiteData } from "@/types";

const MAX_BACKUP_SIZE = 20 * 1024 * 1024;
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".svg",
	".ico",
]);

async function requireAuth(): Promise<boolean> {
	const store = await cookies();
	const token = store.get(SESSION_COOKIE)?.value;
	return !!verifySession(token);
}

function safeUploadName(name: string): string | null {
	const base = path.basename(name);
	if (!base || base.startsWith(".")) return null;
	if (base !== name) return null;
	if (!ALLOWED_UPLOAD_EXTENSIONS.has(path.extname(base).toLowerCase())) return null;
	return base;
}

function readAllUploads(): ZipEntry[] {
	if (!fs.existsSync(UPLOADS_DIR)) return [];
	const entries: ZipEntry[] = [];
	for (const file of fs.readdirSync(UPLOADS_DIR)) {
		const full = path.join(UPLOADS_DIR, file);
		try {
			const stat = fs.statSync(full);
			if (!stat.isFile()) continue;
			entries.push({
				name: `uploads/${file}`,
				data: fs.readFileSync(full),
			});
		} catch {
			// ignore
		}
	}
	return entries;
}

/**
 * GET：导出完整备份为 ZIP 压缩包，包含
 *   - website.json
 *   - nav.json
 *   - uploads/<filename>...
 */
export async function GET() {
	if (!(await requireAuth())) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}
	try {
		const websiteData = readWebsiteData();
		const nav = readNav();
		const meta = {
			version: "2.0",
			exportTime: new Date().toISOString(),
		};
		const entries: ZipEntry[] = [
			{
				name: "meta.json",
				data: Buffer.from(JSON.stringify(meta, null, 2), "utf8"),
			},
			{
				name: "website.json",
				data: Buffer.from(JSON.stringify(websiteData, null, 2), "utf8"),
			},
			{
				name: "nav.json",
				data: Buffer.from(JSON.stringify(nav, null, 2), "utf8"),
			},
			...readAllUploads(),
		];
		const zipBuf = createZip(entries);
		const date = new Date().toISOString().slice(0, 10);
		// Buffer 是 Uint8Array 的子类，可直接作为 Response Body
		return new NextResponse(new Uint8Array(zipBuf), {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="go-nav-backup-${date}.zip"`,
				"Cache-Control": "no-store",
			},
		});
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}

/**
 * POST：导入 ZIP 备份并覆盖写入。
 * 接受 application/zip（或 octet-stream）原始字节，body 即 zip 文件内容。
 */
export async function POST(req: Request) {
	if (!(await requireAuth())) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}

	let buf: Buffer;
	try {
		const ab = await req.arrayBuffer();
		if (!ab || ab.byteLength === 0) {
			return NextResponse.json(
				{ error: "请上传备份 zip 文件" },
				{ status: 400 },
			);
		}
		if (ab.byteLength > MAX_BACKUP_SIZE) {
			return NextResponse.json(
				{ error: "备份文件过大 (最大 20MB)" },
				{ status: 413 },
			);
		}
		buf = Buffer.from(ab);
	} catch {
		return NextResponse.json({ error: "读取请求体失败" }, { status: 400 });
	}

	let entries: ZipEntry[];
	try {
		entries = parseZip(buf);
	} catch (e) {
		return NextResponse.json(
			{ error: `解析 zip 失败：${(e as Error).message}` },
			{ status: 400 },
		);
	}

	let websiteData: WebsiteData | null = null;
	let nav: NavConfig | null = null;
	const uploads: { name: string; data: Buffer }[] = [];

	for (const ent of entries) {
		if (ent.name === "website.json") {
			try {
				websiteData = JSON.parse(ent.data.toString("utf8")) as WebsiteData;
			} catch {
				return NextResponse.json(
					{ error: "website.json 解析失败" },
					{ status: 400 },
				);
			}
		} else if (ent.name === "nav.json") {
			try {
				nav = JSON.parse(ent.data.toString("utf8")) as NavConfig;
			} catch {
				return NextResponse.json(
					{ error: "nav.json 解析失败" },
					{ status: 400 },
				);
			}
		} else if (ent.name.startsWith("uploads/")) {
			const safe = safeUploadName(ent.name.slice("uploads/".length));
			if (safe) uploads.push({ name: safe, data: ent.data });
		}
	}

	if (!websiteData && !nav && uploads.length === 0) {
		return NextResponse.json(
			{ error: "压缩包中未找到 website.json / nav.json / uploads/" },
			{ status: 400 },
		);
	}

	try {
		if (websiteData) writeWebsiteData(websiteData);
		if (nav) writeNav(nav);
		if (uploads.length > 0) {
			fs.mkdirSync(UPLOADS_DIR, { recursive: true });
			for (const u of uploads) {
				fs.writeFileSync(path.join(UPLOADS_DIR, u.name), u.data);
			}
		}
		revalidatePath("/");
		return NextResponse.json({
			ok: true,
			restored: {
				website: !!websiteData,
				nav: !!nav,
				uploads: uploads.length,
			},
		});
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}
