"use client"

import * as React from "react"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Trash2,
  CornerDownLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface ComposerInputProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onSend: (message: string) => void
  placeholder?: string
  sendLabel?: string
  disabled?: boolean
}

/**
 * کامنت خریدار/کاربر: بدون لینک، تصویر، فایل، ویس.
 * فرمت متن ساده (دکمه فقط UI؛ محتوای خام ارسال می‌شود + sanitize سرور).
 */
const ComposerInput = React.forwardRef<HTMLDivElement, ComposerInputProps>(
  (
    {
      className,
      onSend,
      placeholder = "نظر خود را بنویسید…",
      sendLabel = "ارسال",
      disabled,
      ...props
    },
    ref,
  ) => {
    const [message, setMessage] = React.useState("")

    const handleSend = () => {
      const t = message.trim()
      if (!t || disabled) return
      onSend(t)
      setMessage("")
    }

    const toolbarItems = [
      { icon: Bold, tooltip: "پررنگ" },
      { icon: Italic, tooltip: "کج" },
      { icon: Underline, tooltip: "زیرخط" },
      { icon: List, tooltip: "لیست" },
      { icon: ListOrdered, tooltip: "لیست شماره‌دار" },
      { icon: Quote, tooltip: "نقل‌قول" },
    ]

    return (
      <TooltipProvider>
        <div
          ref={ref}
          dir="rtl"
          className={cn(
            "bg-card text-card-foreground focus-within:ring-ring flex w-full flex-col rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-offset-2",
            className,
          )}
          {...props}
        >
          <div className="flex items-center justify-between border-b p-2">
            <div className="flex items-center gap-1">
              {toolbarItems.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      tabIndex={-1}
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  onClick={() => setMessage("")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>پاک کردن</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-grow p-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[100px] w-full resize-none border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex items-center justify-between border-t p-2">
            <p className="text-muted-foreground text-xs">
              لینک و تصویر مجاز نیست
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={disabled || !message.trim()}
            >
              {sendLabel}
              <CornerDownLeft className="ms-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </TooltipProvider>
    )
  },
)
ComposerInput.displayName = "ComposerInput"
export { ComposerInput }
