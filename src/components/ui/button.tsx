import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-safe:btn-3d",
  {
    variants: {
      variant: {
        default:
          "btn-glow text-white border-0",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5",
        outline:
          "border border-violet-200/80 bg-white shadow-sm hover:bg-violet-50/50 hover:border-violet-300 hover:text-violet-900 motion-safe:hover:-translate-y-0.5",
        secondary:
          "bg-violet-50 text-violet-900 shadow-sm hover:bg-violet-100 motion-safe:hover:-translate-y-0.5",
        ghost: "hover:bg-violet-50/80 hover:text-violet-900",
        link: "text-violet-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
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
