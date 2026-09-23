import { LumaSpin } from "@/components/ui/luma-spin";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true" aria-label="در حال بارگذاری">
      <LumaSpin />
    </div>
  );
}
