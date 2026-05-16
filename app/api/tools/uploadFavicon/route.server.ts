import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/store";

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;

/**
 * 接收 Data URL 或图片 URL，下载并保存到 uploads 目录。
 * POST /api/tools/uploadFavicon
 * Body: { faviconUrl: string } // data:image/...base64 或 https://...
 */
export async function POST(req: Request) {
	const store = await cookies();
	if (!verifySession(store.get(SESSION_COOKIE)?.value)) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}

	try {
		const body = (await req.json()) as { faviconUrl?: string };
		const faviconUrl = body?.faviconUrl;
		if (!faviconUrl) {
			return NextResponse.json({ error: "缺少 faviconUrl" }, { status: 400 });
		}

		let bytes: Buffer;
		let ext = ".png";

		if (faviconUrl.startsWith("data:image/")) {
			const match = faviconUrl.match(/^data:image\/(\w+);base64,(.+)$/i);
			if (!match) {
				return NextResponse.json({ error: "无效的 Data URL" }, { status: 400 });
			}
			const mime = match[1].toLowerCase();
			ext = mime === "svg+xml" ? ".svg" : `.${mime}`;
			bytes = Buffer.from(match[2], "base64");
		} else if (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://")) {
			const res = await fetch(faviconUrl);
			if (!res.ok) {
				return NextResponse.json({ error: `下载失败 HTTP ${res.status}` }, { status: 400 });
			}
			const contentType = res.headers.get("content-type") || "";
			if (!contentType.startsWith("image/")) {
				return NextResponse.json({ error: "不是有效的图片" }, { status: 400 });
			}
			if (contentType.includes("svg")) ext = ".svg";
			else if (contentType.includes("png")) ext = ".png";
			else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
			else if (contentType.includes("gif")) ext = ".gif";
			else if (contentType.includes("webp")) ext = ".webp";
			else if (contentType.includes("icon")) ext = ".ico";
			bytes = Buffer.from(await res.arrayBuffer());
		} else {
			return NextResponse.json({ error: "不支持的 URL 格式" }, { status: 400 });
		}

		if (bytes.length > MAX_UPLOAD_SIZE) {
			return NextResponse.json({ error: "图标过大（最大 2MB）" }, { status: 413 });
		}

		const url = saveUpload(`favicon${ext}`, bytes);
		return NextResponse.json({ url });
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}
