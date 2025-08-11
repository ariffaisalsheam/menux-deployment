import * as React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const dimension = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-12 w-12" : "h-8 w-8"
  return (
    <div
      className={cn("inline-block animate-spin rounded-full border-2 border-primary border-t-transparent", dimension, className)}
      {...props}
    />
  )
}



