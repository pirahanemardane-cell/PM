export default function Loading() {
  return (
    <div className="bg-background/60 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-[1px]">
      <div className="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  );
}
