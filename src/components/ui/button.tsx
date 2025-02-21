import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#6D28D9] text-white hover:bg-white hover:text-[#6D28D9] border border-transparent hover:border-[#6D28D9]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-white hover:text-destructive border border-transparent hover:border-destructive",
        outline:
          "border border-[#6D28D9] bg-transparent text-[#6D28D9] hover:bg-[#6D28D9] hover:text-white",
        secondary:
          "bg-[#8B5CF6] text-white hover:bg-white hover:text-[#8B5CF6] border border-transparent hover:border-[#8B5CF6]",
        ghost: "text-[#6D28D9] hover:bg-[#6D28D9]/10",
        link: "text-[#6D28D9] underline-offset-4 hover:underline",
        epic: "bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#8B5CF6] text-white hover:bg-white hover:from-white hover:via-white hover:to-white hover:text-[#6D28D9] border border-transparent hover:border-[#6D28D9]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-[12px] px-4 text-xs",
        lg: "h-12 rounded-[16px] px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
