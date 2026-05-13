import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/server/paths";

const MIME: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
};

/**
 * 提供 data/uploads 下文件的访问能力：GET /uploads/xxx.png
 * (仅 server 模式下生效；静态模式下文件会被预构建脚本复制到 public/uploads)
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path: segs } = await params;
	const target = path.join(UPLOADS_DIR, ...segs);
	const rel = path.relative(UPLOADS_DIR, target);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}
	if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
		return NextResponse.json({ error: "not found" }, { status: 404 });
	}
	const ext = path.extname(target).toLowerCase();
	const buf = fs.readFileSync(target);
	const headers = new Headers({
		"Content-Type": MIME[ext] || "application/octet-stream",
		"Cache-Control": "public, max-age=31536000, immutable",
		"X-Content-Type-Options": "nosniff",
	});
	if (ext === ".svg") {
		headers.set("Content-Security-Policy", "script-src 'none'; sandbox");
	}
	// 复制到一个全新的 ArrayBuffer，避免共享 SharedArrayBuffer 的类型告警
	const ab = new ArrayBuffer(buf.byteLength);
	new Uint8Array(ab).set(buf);
	return new Response(ab, {
		headers,
	});
}
