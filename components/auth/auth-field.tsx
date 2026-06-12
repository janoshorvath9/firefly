import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

export function AuthField({ icon, label, children }: Props) {
  return (
    <label className="group block">
      <span className="font-mono text-[10px] tracking-wider-2 text-foreground/40 transition-colors group-focus-within:text-firefly">
        {label.toUpperCase()}
      </span>
      <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-border bg-surface-1/50 px-4 py-3 transition-all group-focus-within:border-firefly/50 group-focus-within:bg-surface-1 group-focus-within:shadow-[0_0_0_4px_oklch(0.96_0.085_100/0.08)]">
        <span className="text-foreground/40 transition-colors group-focus-within:text-firefly">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}
