"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { readCurrentEventDraft } from "@/lib/storage/localEventStorage";
import { HelpStepCard } from "./HelpStepCard";
import { EligibilityCriteriaCard } from "./EligibilityCriteriaCard";

function subscribeToDraftChanges() {
  return () => undefined;
}

function getDraftSnapshot() {
  return readCurrentEventDraft() !== null;
}

function getServerDraftSnapshot() {
  return false;
}

export function HelpSection() {
  const hasDraft = useSyncExternalStore(
    subscribeToDraftChanges,
    getDraftSnapshot,
    getServerDraftSnapshot
  );

  return (
    <main className="min-h-screen px-4 pb-10 pt-7">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <header className="text-center">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            Volver al cálculo
          </Link>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Ayuda rápida
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-stone-950">
            ¿Cómo funciona?
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-600">
            ¿Quién puso qué? te ayuda a repartir gastos cuando una o más familias
            pagaron por adelantado y después hay que equilibrar aportes.
          </p>
        </header>

        <HelpStepCard title="La idea simple">
          <p>
            Cargás quiénes participaron, cuánto puso cada familia y la app
            calcula quién debe pagar, quién debe cobrar y qué transferencias
            conviene hacer.
          </p>
        </HelpStepCard>

        <HelpStepCard title="Paso 1: creá el evento">
          <p>Primero indicá el nombre del evento.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Asado del sábado</li>
            <li>Cumple de Juli</li>
            <li>Tercer tiempo</li>
            <li>Cena familiar</li>
          </ul>
          <p>
            Ese nombre aparece en el resultado, en WhatsApp y en el ticket PDF.
          </p>
        </HelpStepCard>

        <HelpStepCard title="Paso 2: cargá las familias">
          <p>Para cada familia o grupo participante indicás:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>nombre</li>
            <li>cantidad de integrantes</li>
            <li>cuánto dinero pagó</li>
            <li>una nota opcional</li>
          </ul>
          <p>Si una familia no pagó nada, cargás monto cero.</p>
        </HelpStepCard>

        <HelpStepCard title="Un solo integrante">
          <p>
            Si una familia tiene un solo integrante, la app pregunta si esa
            persona es adulto o menor.
          </p>
          <p>
            <strong>Adulto:</strong> participa del reparto y paga su parte.
          </p>
          <p>
            <strong>Menor:</strong> queda como invitado no aportante y no paga.
          </p>
        </HelpStepCard>

        <EligibilityCriteriaCard />

        <HelpStepCard title="Reparto por familia">
          <p>
            Cada familia habilitada paga la misma parte. Suele servir cuando los
            grupos tienen tamaños parecidos.
          </p>
          <p>
            Ejemplo: si el gasto fue $100.000 y hay 10 familias habilitadas,
            cada familia aporta $10.000.
          </p>
        </HelpStepCard>

        <HelpStepCard title="Reparto por persona">
          <p>
            Cada familia paga según la cantidad de integrantes habilitados. Suele
            ser más justo cuando hay familias chicas y familias grandes.
          </p>
          <p>
            Ejemplo: si hay 20 personas habilitadas y el gasto fue $100.000, el
            valor por persona es $5.000. Una familia de 4 paga $20.000.
          </p>
        </HelpStepCard>

        <HelpStepCard title="Criterio sugerido">
          <p>
            La app puede sugerir si conviene repartir por familia o por persona.
            Mira cuántas familias participan, cuántas personas hay, cuántas
            familias son de un solo adulto, cuántas son grandes y qué diferencia
            económica hay entre los dos criterios.
          </p>
          <p>La sugerencia no es obligatoria. Siempre podés elegir manualmente.</p>
        </HelpStepCard>

        <HelpStepCard title="Balances y transferencias">
          <p>
            El balance compara cuánto pagó una familia contra cuánto le
            correspondía pagar.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Si pagó de más, cobra.</li>
            <li>Si pagó de menos, paga.</li>
            <li>Si pagó justo, queda equilibrada.</li>
          </ul>
          <p>
            Con esos balances, la app arma transferencias sugeridas para que
            todos terminen aportando lo justo.
          </p>
        </HelpStepCard>

        <HelpStepCard title="Salidas del cálculo">
          <ul className="list-disc space-y-1 pl-5">
            <li>Resultado en pantalla.</li>
            <li>Resumen para WhatsApp.</li>
            <li>Ticket PDF completo.</li>
            <li>Evento cerrado en el historial local del navegador.</li>
          </ul>
          <p>
            El ticket PDF funciona como cierre del cálculo y se puede compartir
            con los participantes.
          </p>
        </HelpStepCard>

        <HelpStepCard title="Privacidad">
          <p>
            La app funciona sin cuenta, sin backend y sin base de datos. El
            cálculo se realiza en tu navegador.
          </p>
          <p>
            Si cargás una foto para el ticket PDF, se usa localmente para generar
            el archivo. No se sube a ningún servidor.
          </p>
        </HelpStepCard>

        <Link
          href="/"
          className="mt-2 inline-flex min-h-14 items-center justify-center rounded-lg bg-orange-600 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          {hasDraft ? "Ir a realizar el cálculo" : "Generar el primer cálculo"}
        </Link>
      </div>
    </main>
  );
}
