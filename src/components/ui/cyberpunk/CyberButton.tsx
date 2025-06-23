import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cyberButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cyber-purple to-cyber-jade text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:-translate-y-0.5",
        destructive: "bg-cyber-red text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]",
        outline: "border border-cyber-purple bg-transparent text-cyber-purple hover:bg-cyber-purple hover:text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.6)]",
        secondary: "bg-cyber-gray-800 text-cyber-gray-200 hover:bg-cyber-gray-700 hover:text-white",
        ghost: "text-cyber-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10",
        link: "text-cyber-purple underline-offset-4 hover:text-cyber-purple-light hover:underline",
        glow: "bg-transparent border border-cyber-jade text-cyber-jade hover:bg-cyber-jade hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cyberButtonVariants> {
  asChild?: boolean
  pulse?: boolean
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant, size, asChild = false, pulse = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(
          cyberButtonVariants({ variant, size, className }),
          pulse && (variant === "default" || variant === "glow") && "animate-pulse"
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect for primary buttons */}
        {variant === "default" && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        )}
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
        
        {/* Corner accents */}
        {(variant === "outline" || variant === "glow") && (
          <>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current" />
          </>
        )}
      </Comp>
    )
  }
)
CyberButton.displayName = "CyberButton"

export { CyberButton, cyberButtonVariants }