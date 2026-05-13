"use client";

import { useEffect } from "react";
import type { ThemeMode } from "@/types";

/**
 * 主题控制器 — 根据配置的 themeMode 控制 <html> 的 class
 * - "light": 始终 light
 * - "dark": 始终 dark
 * - "system": 跟随系统 prefers-color-scheme
 */
export function ThemeProvider({
	mode = "light",
	children,
}: {
	mode?: ThemeMode;
	children: React.ReactNode;
}) {
	useEffect(() => {
		const root = document.documentElement;

		const applyTheme = (dark: boolean) => {
			if (dark) {
				root.classList.add("dark");
				root.style.colorScheme = "dark";
			} else {
				root.classList.remove("dark");
				root.style.colorScheme = "light";
			}
		};

		if (mode === "dark") {
			applyTheme(true);
			return;
		}

		if (mode === "light") {
			applyTheme(false);
			return;
		}

		// system mode
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		applyTheme(mq.matches);

		const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [mode]);

	return <>{children}</>;
}
