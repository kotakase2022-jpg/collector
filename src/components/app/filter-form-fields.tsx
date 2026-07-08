import * as React from "react";
import { Input } from "@/components/ui/input";

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={props.name}>{label}</FieldLabel>
      <Input id={props.name} {...props} />
    </div>
  );
}

export function NativeSelect({
  label,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={props.name}>{label}</FieldLabel>
      <select
        id={props.name}
        {...props}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}
