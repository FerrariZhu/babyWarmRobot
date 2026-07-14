"use client";

import { useRef } from "react";
import { MaterialIcon } from "@/components/stitch/material-icon";

function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      /* Safari / unsupported context */
    }
  }
  input.focus();
  input.click();
}

export function BabyBirthDateField({
  id = "baby_dob",
  value,
  onChange,
  required = true,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-surface-variant bg-surface-container-lowest p-4 shadow-[0_2px_12px_rgba(62,102,88,0.03)] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <div className="min-w-0 flex-1">
        <label className="font-label-caps mb-1.5 block uppercase tracking-wider text-outline" htmlFor={id}>
          生日
        </label>
        <input
          ref={inputRef}
          id={id}
          type="date"
          className="date-input-field font-body-lg w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-on-background outline-none focus:ring-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
      <button
        type="button"
        aria-label="选择生日"
        onClick={() => openDatePicker(inputRef.current)}
        className="ml-4 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-container-low text-primary transition-colors hover:bg-surface-container-high"
      >
        <MaterialIcon name="calendar_today" className="text-[20px]" />
      </button>
    </div>
  );
}
