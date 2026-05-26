import { MaterialIcon } from "./material-icon";

export function WhyThisWorks({ reason }: { reason: string }) {
  return (
    <section className="mb-8 rounded-xl bg-surface-container-low p-6 cloud-shadow">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-fixed-dim">
          <MaterialIcon name="wb_incandescent" className="text-on-secondary-fixed-variant" />
        </div>
        <div>
          <h3 className="font-body-lg mb-2 font-semibold text-on-surface">穿搭解析</h3>
          <p className="font-body-md text-on-surface-variant">{reason}</p>
        </div>
      </div>
    </section>
  );
}
