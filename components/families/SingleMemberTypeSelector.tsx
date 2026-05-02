"use client";
import type { SingleMemberType } from "@/types/family";

interface SingleMemberTypeSelectorProps {
  value: SingleMemberType;
  onChange: (type: SingleMemberType) => void;
}

export function SingleMemberTypeSelector({
  value,
  onChange,
}: SingleMemberTypeSelectorProps) {
  return (
    <div>
      <p className="text-xs font-medium text-stone-600 mb-2">
        ¿Es adulto o menor?
      </p>
      <div className="flex gap-2">
        {(["adult", "minor"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={[
              "flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all",
              value === type
                ? type === "adult"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-amber-400 bg-amber-50 text-amber-700"
                : "border-stone-200 bg-white text-stone-500 hover:border-orange-200",
            ].join(" ")}
          >
            {type === "adult" ? "👤 Adulto" : "🧒 Menor"}
          </button>
        ))}
      </div>
      {value === "minor" && (
        <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          Invitado no aportante: menor sin cargo. 🎉
        </p>
      )}
    </div>
  );
}
