import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth";

/**
 * 退出登录：清除 session cookie
 */
export async function POST() {
	const res = NextResponse.json({ ok: true });
	res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
	return res;
}
