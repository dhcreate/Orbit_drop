import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500",
          "transition-all duration-300 ease-out",
          "focus:outline-none focus:ring-1 focus:ring-[#4F8EF7]/50 focus:border-[#4F8EF7]/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
