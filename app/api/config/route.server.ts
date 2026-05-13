import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NavConfig, WebsiteData } from "@/types";
import { SESSION_COOKIE, verifySession } from "@/lib/server/auth";
import { readNav, readWebsiteData, writeNav, writeWebsiteData } from "@/lib/server/store";

async function requireAuth(): Promise<boolean> {
	const store = await cookies();
	const token = store.get(SESSION_COOKIE)?.value;
	return !!verifySession(token);
}

/**
 * 读取完整配置（需鉴权）。
 * 前台页面通过 SSR 直读本地文件，不使用此接口；
 * 这里只供后台、编辑器等已登录场景调用，避免外部直接拉取全量配置。
 */
export async function GET() {
	if (!(await requireAuth())) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}
	try {
		return NextResponse.json({ websiteData: readWebsiteData(), nav: readNav() });
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}

/**
 * 更新配置：PUT { websiteData?, nav? }。鉴权。
 * 成功后触发前台页面 revalidate。
 */
export async function PUT(req: Request) {
	if (!(await requireAuth())) {
		return NextResponse.json({ error: "未登录" }, { status: 401 });
	}
	let body: { websiteData?: WebsiteData; nav?: NavConfig };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "invalid body" }, { status: 400 });
	}
	try {
		if (body.websiteData) writeWebsiteData(body.websiteData);
		if (body.nav) writeNav(body.nav);
		revalidatePath("/");
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: (e as Error).message }, { status: 500 });
	}
}
