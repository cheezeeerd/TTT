import { clsx } from "clsx";
import { ReactNode, HTMLAttributes } from "react";

export function GlassCard({ className, children, ...rest }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-lg shadow-black/20",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
