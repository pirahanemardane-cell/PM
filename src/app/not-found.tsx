import { NotFound, Illustration } from "@/components/ui/not-found";

export default function GlobalNotFound() {
  return (
    <div className="bg-background relative flex min-h-[70vh] w-full flex-col justify-center p-6 md:p-10">
      <div className="relative mx-auto w-full max-w-5xl">
        <Illustration className="text-foreground pointer-events-none absolute inset-0 h-[45vh] w-full opacity-[0.04] dark:opacity-[0.03]" />
        <NotFound />
      </div>
    </div>
  );
}
