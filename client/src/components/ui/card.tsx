"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMeasure } from "@uidotdev/usehooks";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-xl border border-neutral-200 bg-white text-neutral-950 dark:border-neutral-850 dark:bg-neutral-900 dark:text-neutral-50 overflow-hidden transition-all duration-300 animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardLoader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [ref2, { width }] = useMeasure();

  return (
    <div ref={ref2} className="mt-[-15px] absolute top-0 left-0 w-full">
      {/* @ts-ignore */}
      <l-zoomies
        size={1000}
        stroke="3"
        bg-opacity="0.1"
        speed="1.4"
        color="hsl(var(--fuchsia-400))"
      />
    </div>
  );
});
CardLoader.displayName = "CardLoader";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative p-4 pt-0 transition-all duration-300 animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardLoader,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
