const DONATION_QR_CODES = [
	{
		title: "微信",
		subtitle: "微信支付",
		src: "https://www.gotab.cn/images/wxpay.JPG",
	},
	{
		title: "支付宝",
		subtitle: "支付宝",
		src: "https://www.gotab.cn/images/alipay.JPG",
	},
] as const;

export function DonationEditor() {
	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-6">
			<div className="text-center">
				<h3 className="text-lg font-semibold text-gray-950 dark:text-neutral-50">
					支持 Go Nav 持续维护
				</h3>
				<p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
					如果这个项目节省了你的时间，欢迎打赏支持。每一份支持都会变成继续迭代的动力。
				</p>
			</div>

			<div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-2">
				{DONATION_QR_CODES.map((item) => (
					<QrPreview
						key={item.title}
						title={item.title}
						subtitle={item.subtitle}
						src={item.src}
					/>
				))}
			</div>
		</div>
	);
}

function QrPreview({
	title,
	src,
}: {
	title: string;
	subtitle: string;
	src: string;
}) {
	return (
		<div className="flex flex-col items-center">
			<div className="border h-56 w-auto min-w-36 overflow-hidden rounded-xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={src}
					alt={`${title}打赏二维码`}
					className="h-full object-contain"
				/>
			</div>
			<div className="mt-4 text-center">
				<div className="text-base font-semibold text-gray-950 dark:text-neutral-50">
					{title}
				</div>
			</div>
		</div>
	);
}
