"use client";
import { useState } from "react";
import type { Family, SingleMemberType } from "@/types/family";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SingleMemberTypeSelector } from "./SingleMemberTypeSelector";

interface FamilyFormProps {
  onAdd: (family: Omit<Family, "id">) => void;
}

export function FamilyForm({ onAdd }: FamilyFormProps) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState(2);
  const [singleMemberType, setSingleMemberType] = useState<SingleMemberType>(null);
  const [paidAmount, setPaidAmount] = useState("");

  const isValid =
    name.trim() &&
    members >= 1 &&
    members <= 5 &&
    (members !== 1 || singleMemberType !== null) &&
    paidAmount !== "" &&
    !isNaN(Number(paidAmount));

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      name: name.trim(),
      members,
      singleMemberType: members === 1 ? singleMemberType : null,
      paidAmount: Number(paidAmount),
    });
    setName("");
    setMembers(2);
    setSingleMemberType(null);
    setPaidAmount("");
  };

  return (
    <Card padding="md">
      <h3 className="font-semibold text-stone-700 mb-3">Agregar familia</h3>
      <div className="flex flex-col gap-3">
        <Input
          label="Nombre"
          placeholder="Ej: Los García"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="text-sm font-medium text-stone-700 block mb-1">
            Integrantes
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setMembers(n);
                  if (n !== 1) setSingleMemberType(null);
                }}
                className={[
                  "flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all",
                  members === n
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-stone-200 bg-white text-stone-500 hover:border-orange-300",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        {members === 1 && (
          <SingleMemberTypeSelector
            value={singleMemberType}
            onChange={setSingleMemberType}
          />
        )}
        <Input
          label="¿Cuánto puso?"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
          hint="En pesos. Ingresá 0 si no puso nada."
        />
        <Button fullWidth onClick={handleSubmit} disabled={!isValid}>
          Agregar familia
        </Button>
      </div>
    </Card>
  );
}
