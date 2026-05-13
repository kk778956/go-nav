"use client";

import { Button } from "@heroui/react";
import { memo, useEffect, useRef, useState } from "react";
import type { LayoutConfig } from "@/types";
import { useRecentVisits } from "@/hooks/use-recent-visits";
import { SiteCard } from "./site-card";

function parseCssSizeToPx(value: string, fallback = 16) {
	const n = parseFloat(value);
	if (Number.isNaN(n)) return fallback;
	if (/rem$/.test(value)) return n * 16;
	return n;
}

/**
 * 最近访问组件。
 *
 * 状态就近管理：visits / clearVisits / mounted 只在本组件内部使用，
 * 直接通过 useRecentVisits 在内部获取，避免 visits 变化触发外层
 * AppLayout 重渲染。
 *
 * 外部 memo 包裹，避免样式类 props 未变时因父级重渲染被牊连。
 */
export const RecentVisits = memo(function RecentVisits({
	maxItems = 20,
	cardMinWidth = "160px",
	cardHeight = "64px",
	cardGridPadding = "8px",
	sectionGap = "16px",
	delay = 150,
	layout,
}: {
	maxItems?: number;
	cardMinWidth?: string;
	cardHeight?: string;
	cardGridPadding?: string;
	/** 与 CategorySection 之间的间距，用于高度过渡计算 */
	sectionGap?: string;
	/** 延迟显示时间（毫秒），默认 150ms */
	delay?: number;
	layout?: Required<LayoutConfig>;
}) {
	const { visits, clearVisits, mounted } = useRecentVisits();
	const innerRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState("0px");
	const [visible, setVisible] = useState(false);

	// 延迟显示，避免页面加载时突然跳动
	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	// sectionGap 解析为数值，兼容 "16px" / "1rem" 等（rem 简化为 * 16）
	const gapPx = parseCssSizeToPx(sectionGap);

	// 使用 ResizeObserver 自动跟踪内容高度变化，替代 resize 事件 + setTimeout
	useEffect(() => {
		if (!mounted || !visible) return; // 延迟期间不计算高度
		const el = innerRef.current;
		if (!el) return;

		const observer = new ResizeObserver(() => {
			const h = el.scrollHeight + gapPx;
			const next = `${h}px`;
			setHeight((prev) => (prev === next ? prev : next));
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [mounted, visible, gapPx]);

	// visits 变化时也需重新计算（ResizeObserver 不一定能捕获子元素数量变化导致的高度变化）
	useEffect(() => {
		if (!mounted || !visible) return; // 延迟期间不计算高度
		const el = innerRef.current;
		if (el) {
			const h = el.scrollHeight + gapPx;
			const next = `${h}px`;
			setHeight((prev) => (prev === next ? prev : next));
		}
	}, [mounted, visible, visits.length, gapPx]);

	// 数据检查（即使在延迟期间也计算，确保高度正确）
	const hasData = visits.length > 0;
	const displayVisits = visits.slice(0, maxItems);

	if (!mounted || !hasData) return null;

	return (
		<div
			className="transition-all duration-300 ease-out"
			style={{
				height,
				opacity: visible ? 1 : 0,
				transition: visible
					? "opacity 300ms ease-out, height 300ms ease-out"
					: "none",
			}}
		>
			<div ref={innerRef}>
				<section className="mb-4">
					<div className="mb-3 flex items-center justify-between px-3">
						<h2 className="font-semibold text-nowrap text-xl">最近访问</h2>
						<Button
							variant="tertiary"
							size="sm"
							className="text-xs text-muted"
							onPress={clearVisits}
						>
							清空
						</Button>
					</div>
					<div style={{ padding: `8px ${cardGridPadding}` }}>
						<div
							className="grid gap-3"
							style={{
								gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}, 1fr))`,
								gridAutoRows: cardHeight,
							}}
						>
							{displayVisits.map((v) => (
								<SiteCard
									key={`${v.url}::${v.title}`}
									site={v}
									trackVisit={false}
									layout={layout}
								/>
							))}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
});
