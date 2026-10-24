/** لینک پرش به محتوای اصلی — فقط با کیبورد دیده می‌شود */
export function SkipToContent({
  targetId = "main-content",
  label = "پرش به محتوای اصلی",
}: {
  targetId?: string;
  label?: string;
}) {
  return (
    <a href={`#${targetId}`} className="skip-to-content">
      {label}
    </a>
  );
}
