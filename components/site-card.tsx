"use client";

import { memo } from "react";
import type { LayoutConfig, NavSite } from "@/types";
import { recordVisit } from "@/hooks/use-recent-visits";
import { getIconImageSrc } from "@/lib/icon";

/** SiteCard 接受的站点数据，description 可选以兼容 RecentVisit */
export interface SiteCardData {
	url: string;
	title: string;
	icon?: string;
	description?: string;
	tags?: string[];
}

/** 将数字自动补 px */
export function toPx(v: string | undefined): string | undefined {
	if (!v) return undefined;
	return /^\d+$/.test(v) ? `${v}px` : v;
}

/** 仅将 undefined / null / 空字符串 / 全空格视为未配置，"0" 仍算有效值 */
export function resolveConfiguredValue(
	value: string | undefined,
	fallback?: string,
): string | undefined {
	if (typeof value === "string" && value.trim().length > 0) {
		return value.trim();
	}
	if (typeof fallback === "string" && fallback.trim().length > 0) {
		return fallback.trim();
	}
	return undefined;
}

export function isTransparentColor(value: string | undefined): boolean {
	const color = value?.trim().toLowerCase();
	if (!color) return true;
	if (color === "transparent") return true;

	const functionalMatch = color.match(/^rgba?\((.*)\)$|^hsla?\((.*)\)$/);
	if (functionalMatch) {
		const rawChannels = functionalMatch[1] ?? functionalMatch[2] ?? "";
		const alpha = rawChannels.includes("/")
			? rawChannels.split("/").at(-1)?.trim()
			: rawChannels.split(",").at(-1)?.trim();
		if (!alpha || (!rawChannels.includes("/") && !rawChannels.includes(","))) {
			return false;
		}
		const numericAlpha = alpha.endsWith("%")
			? Number.parseFloat(alpha) / 100
			: Number.parseFloat(alpha);
		return Number.isFinite(numericAlpha) && numericAlpha <= 0;
	}

	if (/^#[0-9a-f]{4}$/i.test(color)) return color.at(-1) === "0";
	if (/^#[0-9a-f]{8}$/i.test(color)) return color.slice(-2) === "00";

	return false;
}

export function resolveSiteBackgroundColor(bgColor: string | undefined): string {
	return isTransparentColor(bgColor)
		? "var(--surface-secondary)"
		: bgColor!.trim();
}

/**
 * 通用网站卡片 - 同时用于分类网格和最近访问
 * 大量渲染场景（>1 万）下：移除 useCallback / 子 memo 子组件，
 * 减少每个实例的 hook slot 与额外函数组件实例。
 */
export const SiteCard = memo(function SiteCard({
	site,
	trackVisit = true,
	layout,
}: {
	site: SiteCardData;
	trackVisit?: boolean;
	layout?: Required<LayoutConfig>;
}) {
	const icon = site.icon;
	const iconSrc = getIconImageSrc(icon);
	const resolvedIconPadding = resolveConfiguredValue(
		(site as NavSite).iconPadding,
		layout?.defaultIconPadding,
	);

	return (
		<a
			href={site.url}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={site.title}
			onClick={trackVisit ? () => recordVisit(site as NavSite) : undefined}
			className="group flex transform-gpu items-center gap-3 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-zinc-800 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:bg-white [@media(hover:hover)]:hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)] active:translate-y-0 active:scale-[0.99] dark:[@media(hover:hover)]:hover:bg-zinc-800"
		>
			<div
				className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-lg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:scale-105"
				style={{
					backgroundColor: resolveSiteBackgroundColor((site as NavSite).bgColor),
					padding: toPx(resolvedIconPadding) || undefined,
					borderRadius:
						layout?.iconBorderRadius !== "full" && layout?.iconBorderRadius
							? toPx(layout.iconBorderRadius)
							: "9999px",
				}}
			>
				{icon ? (
					iconSrc ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							alt=""
							src={iconSrc}
							width={40}
							height={40}
							className="h-full w-full object-contain"
							loading="lazy"
							decoding="async"
						/>
					) : (
						<span aria-hidden className="text-center leading-none">
							{icon}
						</span>
					)
				) : (
					<span className="text-center text-sm font-semibold text-muted">
						{site.title.charAt(0)}
					</span>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium">{site.title}</div>
				<div className="mt-0.5 truncate text-xs text-muted">
					{site.description}
				</div>
			</div>
		</a>
	);
});
