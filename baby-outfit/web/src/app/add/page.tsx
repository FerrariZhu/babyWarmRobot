import { redirect } from "next/navigation";
import { getAddPageData } from "@/lib/wardrobe";
import { AppShell } from "@/components/stitch/app-shell";
import { AddClothingForm } from "@/components/stitch/add-clothing-form";

export default async function AddClothingPage() {
  const data = await getAddPageData();
  if (!data) redirect("/login");

  const { baby, materials, sizes, categories, thicknesses } = data;

  return (
    <AppShell babyName={baby?.name} avatarUrl={baby?.avatar_url} headerVariant="centered">
      <main className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-margin-mobile pt-6">
        <AddClothingForm
          materials={materials}
          sizes={sizes}
          categories={categories}
          thicknesses={thicknesses}
          babyId={baby?.id}
        />
      </main>
    </AppShell>
  );
}
