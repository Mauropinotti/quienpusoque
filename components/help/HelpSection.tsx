import { HelpCta } from "./HelpCta";
import { HelpStepCard } from "./HelpStepCard";
import { EligibilityCriteriaCard } from "./EligibilityCriteriaCard";

// Server Component: la ayuda es contenido estático. Solo el botón final es
// una isla cliente (cambia el texto si hay una cuenta en curso).
export function HelpSection() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-16 pt-8">
      <header>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember-text">
          Ayuda rápida
        </p>
        <h1 className="font-display mt-2 text-5xl sm:text-6xl">¿Cómo funciona?</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          ¿Quién puso qué? te ayuda a repartir gastos cuando una o más familias
          pagaron por adelantado y después hay que equilibrar aportes.
        </p>
      </header>

      <HelpStepCard title="La idea simple" tone="sky">
        <p>
          Cargás quiénes participaron, cuánto puso cada familia y la app calcula
          quién debe pagar, quién debe cobrar y qué transferencias conviene hacer.
        </p>
      </HelpStepCard>

      <HelpStepCard number="01" title="Creá el evento">
        <p>Primero indicá el nombre del evento: “Asado del sábado”, “Cumple de Juli”, “Tercer tiempo” o “Cena familiar”.</p>
        <p>Ese nombre aparece en el resultado, en WhatsApp y en el ticket PDF.</p>
      </HelpStepCard>

      <HelpStepCard number="02" title="Cargá las familias">
        <p>Para cada familia o grupo participante indicás:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>nombre</li>
          <li>cantidad de integrantes</li>
          <li>cuánto dinero pagó</li>
          <li>una nota opcional</li>
        </ul>
        <p>Si una familia no pagó nada, cargás monto cero.</p>
      </HelpStepCard>

      <HelpStepCard title="Un solo integrante" tone="mustard">
        <p>
          Si una familia tiene un solo integrante, la app pregunta si esa persona
          es adulto o menor.
        </p>
        <p>
          <strong>Adulto:</strong> participa del reparto y paga su parte.
        </p>
        <p>
          <strong>Menor:</strong> queda como invitado no aportante, no paga y su
          monto queda fijo en $0.
        </p>
      </HelpStepCard>

      <EligibilityCriteriaCard />

      <div className="grid gap-5 sm:grid-cols-2">
        <HelpStepCard number="03a" title="Por familia">
          <p>
            Cada familia habilitada paga la misma parte. Suele servir cuando los
            grupos tienen tamaños parecidos.
          </p>
          <p className="font-mono text-sm">$100.000 ÷ 10 familias = $10.000 c/u</p>
        </HelpStepCard>
        <HelpStepCard number="03b" title="Por persona">
          <p>
            Cada familia paga según sus integrantes habilitados. Suele ser más
            justo con familias chicas y grandes.
          </p>
          <p className="font-mono text-sm">$100.000 ÷ 20 personas = $5.000 · familia de 4: $20.000</p>
        </HelpStepCard>
      </div>

      <HelpStepCard title="Criterio sugerido">
        <p>
          La app sugiere si conviene repartir por familia o por persona. Mira
          cuántas familias participan, cuántas personas hay, cuántas familias son
          de un solo adulto, cuántas son grandes y qué diferencia económica hay
          entre los dos criterios.
        </p>
        <p>La sugerencia no es obligatoria. Siempre podés elegir manualmente.</p>
      </HelpStepCard>

      <HelpStepCard number="04" title="Balances y transferencias">
        <p>El balance compara cuánto pagó una familia contra cuánto le correspondía pagar.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Si pagó de más, cobra.</li>
          <li>Si pagó de menos, paga.</li>
          <li>Si pagó justo, queda equilibrada.</li>
        </ul>
        <p>
          Con esos balances, la app arma transferencias sugeridas para que todos
          terminen aportando lo justo.
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
          El ticket PDF funciona como cierre del cálculo y se puede compartir con
          los participantes.
        </p>
      </HelpStepCard>

      <HelpStepCard title="Privacidad" tone="sky">
        <p>
          La app funciona sin cuenta, sin backend y sin base de datos. El cálculo
          se realiza en tu navegador.
        </p>
        <p>
          Si cargás una foto para el ticket PDF, se usa localmente para generar el
          archivo. No se sube a ningún servidor.
        </p>
      </HelpStepCard>

      <div className="mt-2">
        <HelpCta />
      </div>
    </div>
  );
}
