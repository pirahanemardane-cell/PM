import { LumaSpin } from "@/components/ui/luma-spin";

export default function Loading() {
  return (
    <div className="bg-background/70 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-[1px]">
      <LumaSpin />
    </div>
  );
}
