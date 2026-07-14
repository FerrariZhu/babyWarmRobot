"use client";

export function OptionChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-label-caps ml-2 text-on-surface-variant">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value !== "" && value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`font-label-caps rounded-full px-4 py-2.5 text-left transition-all active:scale-95 ${
                selected
                  ? "bg-primary text-on-primary cloud-shadow"
                  : "border border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:border-primary/40"
              }`}
            >
              <span className="block">{option.label}</span>
              {option.hint && (
                <span
                  className={`mt-0.5 block text-[10px] font-normal normal-case ${
                    selected ? "text-on-primary/80" : "text-outline"
                  }`}
                >
                  {option.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
