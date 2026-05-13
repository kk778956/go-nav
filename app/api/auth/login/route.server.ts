import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_MS, checkCredentials, createSession } from "@/lib/server/auth";

/**
 * 登录接口：POST { username, password } → 设置 httpOnly cookie
 */
export async function POST(req: Request) {
	let username = "";
	let password = "";
	try {
		const body = (await req.json()) as { username?: string; password?: string };
		username = body.username ?? "";
		password = body.password ?? "";
	} catch {
		return NextResponse.json({ error: "invalid body" }, { status: 400 });
	}

	if (!checkCredentials(username, password)) {
		return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
	}

	const token = createSession(username);
	const res = NextResponse.json({ ok: true });
	res.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: Math.floor(SESSION_TTL_MS / 1000),
	});
	return res;
}
