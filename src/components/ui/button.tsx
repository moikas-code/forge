import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-purple focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-black disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden rounded-md",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyber-purple to-cyber-jade text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:-translate-y-0.5 active:scale-[0.98]",
        destructive:
          "bg-cyber-red text-white hover:bg-cyber-red/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]",
        outline:
          "border border-cyber-purple bg-transparent text-cyber-purple hover:bg-cyber-purple hover:text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.6)]",
        secondary:
          "bg-cyber-gray-800 text-cyber-gray-200 hover:bg-cyber-gray-700 hover:text-white",
        ghost: "text-cyber-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10",
        link: "text-cyber-purple underline-offset-4 hover:text-cyber-purple-light hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
  pulse?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, pulse = false, children, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          pulse && (variant === "default" || variant === "outline") && "animate-pulse"
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect for primary buttons */}
        {variant === "default" && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }