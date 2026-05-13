import { redirect } from "next/navigation";

/**
 * /admin 默认跳转到分类管理。
 */
export default function AdminIndexPage() {
	redirect("/admin/categories");
}
