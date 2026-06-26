import { redirect } from "next/navigation";
import { getAddPageData } from "@/lib/wardrobe";
import { CategoryPicker } from "@/components/stitch/category-picker";

export default async function CategoryPickerPage({
  searchParams,
}: {
  searchParams: Promise<{ current?: string }>;
}) {
  const data = await getAddPageData();
  if (!data) redirect("/login");

  const { current } = await searchParams;

  return <CategoryPicker initialCategory={current ?? null} />;
}
