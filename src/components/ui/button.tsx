import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1324] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#dce1fb] text-[#0c1324] shadow-md hover:bg-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-red-500 text-white shadow-md hover:bg-red-600",
        outline:
          "border border-white/10 bg-transparent text-[#dce1fb] hover:bg-[#23293c] hover:border-white/20",
        secondary:
          "bg-[#23293c] text-[#dce1fb] hover:bg-[#2e3447]",
        ghost:
          "text-[#e0c0b1] hover:bg-[#23293c] hover:text-[#dce1fb]",
        link:
          "text-[#f97316] underline-offset-4 hover:underline",
        coral:
          "bg-[#f97316] text-[#582200] shadow-md hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-[0.98]",
        "coral-outline":
          "border border-[#f97316]/40 text-[#f97316] hover:bg-[#f97316]/10 hover:border-[#f97316]/60",
        violet:
          "bg-[#d0bcff] text-[#1a1528] shadow-md hover:shadow-[0_0_30px_-5px_rgba(208,188,255,0.3)] hover:scale-[1.02] active:scale-[0.98]",
        "violet-outline":
          "border border-[#d0bcff]/40 text-[#d0bcff] hover:bg-[#d0bcff]/10 hover:border-[#d0bcff]/60",
        teal:
          "bg-[#93ccff] text-[#0c1324] shadow-md hover:shadow-[0_0_30px_-5px_rgba(147,204,255,0.3)] hover:scale-[1.02] active:scale-[0.98]",
        glass:
          "bg-[#151b2d]/60 backdrop-blur-xl border border-white/8 text-[#dce1fb] hover:bg-[#23293c]/80 hover:border-white/12",
        hero:
          "bg-gradient-to-r from-[#f97316] to-[#d0bcff] text-[#0c1324] shadow-lg hover:shadow-[0_0_40px_-5px_rgba(249,115,22,0.4)] hover:scale-[1.03] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
