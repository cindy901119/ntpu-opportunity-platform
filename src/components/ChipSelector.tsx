"use client";

export function ChipSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--text)]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className="preference-chip rounded-full px-3 py-2 text-sm font-semibold"
              aria-pressed={active}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
