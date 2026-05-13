"use client";

import {
	memo,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Tabs } from "@heroui/react";
import type { LayoutConfig, NavCategory } from "@/types";
import { IconView } from "./icon-view";
import { SiteCard } from "./site-card";

export const CategorySection = memo(function CategorySection({
	category,
	cardMinWidth = "160px",
	cardHeight = "64px",
	cardGridPadding = "8px",
	showCategoryTitle = true,
	showCategoryDescription = true,
	layout,
}: {
	category: NavCategory;
	cardMinWidth?: string;
	cardHeight?: string;
	cardGridPadding?: string;
	showCategoryTitle?: boolean;
	showCategoryDescription?: boolean;
	layout?: Required<LayoutConfig>;
}) {
	const hasChildren =
		(category.children && category.children.length > 1);

	return (
		<section
			id={category.id}
			data-category-id={category.id}
			className="category-anchor scroll-mt-20"
		>
			{showCategoryTitle && (
				<div className="mb-3 px-3 flex items-center gap-2 *:text-xl">
					<IconView icon={category.icon} size={20} className="align-text-bottom" />
					<h2 className="font-semibold text-nowrap">{category.name}</h2>
					{showCategoryDescription && category.description ? (
						<span className="text-sm! font-medium text-muted truncate">
							{category.description}
						</span>
					) : null}
				</div>
			)}

			{hasChildren ? (
				<SubcategoryTabs
					category={category}
					cardMinWidth={cardMinWidth}
					cardHeight={cardHeight}
					cardGridPadding={cardGridPadding}
					showCategoryTitle={showCategoryTitle}
					showCategoryDescription={showCategoryDescription}
					layout={layout}
				/>
			) : (
				<CategoryContent
					category={category}
					cardMinWidth={cardMinWidth}
					cardHeight={cardHeight}
					cardGridPadding={cardGridPadding}
					showCategoryTitle={showCategoryTitle}
					showCategoryDescription={showCategoryDescription}
					layout={layout}
				/>
			)}
		</section>
	);
});

function CategoryContent({
	category,
	cardMinWidth,
	cardHeight,
	cardGridPadding,
	showCategoryTitle,
	showCategoryDescription,
	layout,
}: {
	category: NavCategory;
	cardMinWidth: string;
	cardHeight: string;
	cardGridPadding: string;
	showCategoryTitle: boolean;
	showCategoryDescription: boolean;
	layout?: Required<LayoutConfig>;
}) {
	if (category.children && category.children.length === 1) {
		return (
			<SubcategoryContent
				category={category.children[0]}
				cardMinWidth={cardMinWidth}
				cardHeight={cardHeight}
				cardGridPadding={cardGridPadding}
				showCategoryTitle={showCategoryTitle}
				showCategoryDescription={showCategoryDescription}
				layout={layout}
			/>
		);
	}

	if (category.sites && category.sites.length > 0) {
		return (
			<SiteGrid
				sites={category.sites}
				cardMinWidth={cardMinWidth}
				cardHeight={cardHeight}
				cardGridPadding={cardGridPadding}
				layout={layout}
			/>
		);
	}

	return <EmptyHint />;
}

function SubcategoryTabs({
	category,
	cardMinWidth,
	cardHeight,
	cardGridPadding,
	showCategoryTitle,
	showCategoryDescription,
	layout,
}: {
	category: NavCategory;
	cardMinWidth: string;
	cardHeight: string;
	cardGridPadding: string;
	showCategoryTitle: boolean;
	showCategoryDescription: boolean;
	layout?: Required<LayoutConfig>;
}) {
	const tabs = useMemo(() => category.children ?? [], [category.children]);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = listRef.current;
		if (!el) return;

		const onWheel = (e: WheelEvent) => {
			const isOverflowing = el.scrollWidth > el.clientWidth;
			if (!isOverflowing) return;

			if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
				e.preventDefault();
				el.scrollLeft += e.deltaY;
			}
		};

		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, []);

	return (
		<Tabs className="w-full">
			<Tabs.ListContainer
				ref={listRef}
				className="w-full overflow-x-auto px-2"
				style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
			>
				<Tabs.List aria-label={`${category.name}的子分类`} className="w-fit">
					{tabs.map((t) => (
						<Tabs.Tab key={t.id} id={t.id} className="text-nowrap">
							{"icon" in t && t.icon ? (
								<span className="mr-1 inline-flex items-center" aria-hidden>
									<IconView icon={t.icon} size={14} />
								</span>
							) : null}
							{t.name}
							<Tabs.Indicator />
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs.ListContainer>

			{tabs.map((t) => (
				<Tabs.Panel key={t.id} id={t.id} className="p-0">
					{"sites" in t ? (
						<SiteGrid
							sites={t.sites}
							cardMinWidth={cardMinWidth}
							cardHeight={cardHeight}
							cardGridPadding={cardGridPadding}
							layout={layout}
						/>
					) : (
						<SubcategoryContent
							category={t as NavCategory}
							cardMinWidth={cardMinWidth}
							cardHeight={cardHeight}
							cardGridPadding={cardGridPadding}
							showCategoryTitle={showCategoryTitle}
							showCategoryDescription={showCategoryDescription}
							layout={layout}
						/>
					)}
				</Tabs.Panel>
			))}
		</Tabs>
	);
}

function SubcategoryContent({
	category,
	cardMinWidth,
	cardHeight,
	cardGridPadding,
	showCategoryTitle,
	showCategoryDescription,
	layout,
}: {
	category: NavCategory;
	cardMinWidth: string;
	cardHeight: string;
	cardGridPadding: string;
	showCategoryTitle: boolean;
	showCategoryDescription: boolean;
	layout?: Required<LayoutConfig>;
}) {
	return (
		<div id={category.id}>
			{category.sites && category.sites.length > 0 ? (
				<SiteGrid
					sites={category.sites}
					cardMinWidth={cardMinWidth}
					cardHeight={cardHeight}
					cardGridPadding={cardGridPadding}
					layout={layout}
				/>
			) : null}

			{category.children?.map((child) => (
				<div key={child.id} id={child.id} className="category-anchor space-y-3">
					{showCategoryTitle && (
						<h3 className="text-base font-semibold">
							{child.icon ? (
								<span className="mr-1 inline-flex items-center" aria-hidden>
									<IconView icon={child.icon} size={16} />
								</span>
							) : null}
							{child.name}
							{showCategoryDescription && child.description ? (
								<span className="ml-2 text-sm font-normal text-muted">{child.description}</span>
							) : null}
						</h3>
					)}
					{child.sites && child.sites.length > 0 ? (
						<SiteGrid
							sites={child.sites}
							cardMinWidth={cardMinWidth}
							cardHeight={cardHeight}
							cardGridPadding={cardGridPadding}
							layout={layout}
						/>
					) : null}
				</div>
			))}
		</div>
	);
}

/** 大列表分批渲染阈值与步长 */
const BATCH_THRESHOLD = 80;
const BATCH_INITIAL = 60;
const BATCH_STEP = 80;

/** 跨浏览器的 idle 调度 */
const scheduleIdle = (cb: () => void) => {
	if (typeof window === "undefined") return 0;
	const ric = (window as unknown as { requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout: number }) => number }).requestIdleCallback;
	if (typeof ric === "function") {
		return ric(() => cb(), { timeout: 300 });
	}
	return window.setTimeout(cb, 50) as unknown as number;
};
const cancelIdle = (id: number) => {
	if (typeof window === "undefined" || !id) return;
	const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
	if (typeof cic === "function") cic(id);
	else clearTimeout(id);
};

const SiteGrid = memo(function SiteGrid({
	sites,
	cardMinWidth = "160px",
	cardHeight = "64px",
	cardGridPadding = "8px",
	layout,
}: {
	sites: NavCategory["sites"];
	cardMinWidth?: string;
	cardHeight?: string;
	cardGridPadding?: string;
	layout?: Required<LayoutConfig>;
}) {
	const total = sites?.length ?? 0;
	const needBatch = total > BATCH_THRESHOLD;
	const [renderCount, setRenderCount] = useState(() =>
		needBatch ? BATCH_INITIAL : total,
	);

	useEffect(() => {
		// sites 变化时重置
		setRenderCount(needBatch ? BATCH_INITIAL : total);
	}, [needBatch, sites, total]);

	useEffect(() => {
		if (!needBatch || renderCount >= total) return;
		const id = scheduleIdle(() => {
			setRenderCount((c) => Math.min(c + BATCH_STEP, total));
		});
		return () => cancelIdle(id);
	}, [needBatch, renderCount, total]);

	if (!sites || total === 0) return null;
	const visible = renderCount >= total ? sites : sites.slice(0, renderCount);

	return (
		<div style={{ padding: `8px ${cardGridPadding}` }}>
			<div
				className="grid gap-3"
				style={{
					gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}, 1fr))`,
					gridAutoRows: cardHeight,
				}}
			>
				{visible.map((s) => (
					<SiteCard key={`${s.title}-${s.url}`} site={s} layout={layout} />
				))}
			</div>
		</div>
	);
});

function EmptyHint() {
	return (
		<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted">
			暂无内容
		</div>
	);
}
