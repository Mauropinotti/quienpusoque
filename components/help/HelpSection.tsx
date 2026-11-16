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
        <p>
          ¿Ya habías empezado y exportaste el cálculo? Tocá{" "}
          <strong>Importar cálculo</strong> y elegí el archivo: seguís donde lo dejaste.
        </p>
      </HelpStepCard>

      <HelpStepCard number="02" title="Cargá las familias">
        <p>Para cada familia o grupo participante indicás:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>nombre</li>
          <li>cuántos adultos y cuántos menores son</li>
          <li>qué puso y cuánto salió cada cosa</li>
        </ul>
        <p>
          Por ejemplo: carne $10.000, hielo $2.000, pan $1.500. Con{" "}
          <strong>Sumar otra cosa</strong> agregás una línea. El total lo suma la
          app: no hace falta hacer la cuenta.
        </p>
        <p>
          Si una familia no puso nada, dejás las líneas vacías. Si llevó algo que
          no costó plata, ponés 0.
        </p>
        <p>
          Cada cosa con su monto aparece en el ticket, en el PDF y en el resumen
          de WhatsApp, para que todos vean qué salió cada cosa.
        </p>
      </HelpStepCard>

      <HelpStepCard title="Adultos y menores" tone="mustard">
        <p>
          En cada familia contás por separado los <strong>adultos</strong> y los{" "}
          <strong>menores</strong>, con los botones − y +.
        </p>
        <p>
          Cuánto pagan los menores no se decide acá: se elige al repartir (todo,
          la mitad o nada).
        </p>
        <p>
          Una familia <strong>sin adultos</strong> (por ejemplo, un chico que vino
          solo) queda como invitada: no paga, no cobra y su monto queda fijo en $0.
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
            Cada persona cuenta como una parte. Suele ser más justo con familias
            chicas y grandes. La app te pregunta cómo pagan los menores.
          </p>
          <p className="font-mono text-sm">$100.000 ÷ 20 personas = $5.000 · familia de 4: $20.000</p>
        </HelpStepCard>
      </div>

      <HelpStepCard title="¿Cómo pagan los menores?" tone="sky">
        <p>Si repartís por persona y hay menores, elegís una de tres opciones:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Igual que los adultos (100%).</strong> Todos pagan una parte
            igual del total.
          </li>
          <li>
            <strong>La mitad (50%).</strong> Cada menor paga la mitad de la parte
            por persona. Lo que no pagan entre todos los menores se reparte en
            partes iguales entre los adultos.
          </li>
          <li>
            <strong>No pagan (0%).</strong> El total se divide solo entre los
            adultos.
          </li>
        </ul>
        <p className="font-mono text-sm leading-relaxed">
          $12.000, 6 adultos y 2 menores, menores al 50%:
          <br />
          $12.000 ÷ 8 = $1.500 por persona
          <br />
          cada menor paga $750 · los 2 menores dejan $1.500
          <br />
          $1.500 ÷ 6 adultos = $250 más · cada adulto paga $1.750
        </p>
        <p>
          El ticket, el PDF y el WhatsApp muestran esta cuenta paso a paso, y lo
          que le toca a cada familia.
        </p>
      </HelpStepCard>

      <HelpStepCard title="Criterio sugerido">
        <p>
          La app sugiere si conviene repartir por familia o por persona (cuánto
          pagan los menores lo deciden ustedes). Mira
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
          <li>Archivo del cálculo, para retomarlo después.</li>
        </ul>
        <p>
          El ticket PDF funciona como cierre del cálculo y se puede compartir con
          los participantes.
        </p>
      </HelpStepCard>

      <HelpStepCard title="Exportar e importar">
        <p>
          ¿Tenés que cortar a la mitad o querés seguir desde otro celular? Tocá{" "}
          <strong>Exportar cálculo</strong>: baja un archivo con todo lo cargado,
          incluido lo que puso cada uno.
        </p>
        <p>
          Para retomarlo, en el primer paso tocá <strong>Importar cálculo</strong>{" "}
          y elegí ese archivo. Si ya tenías otra cuenta abierta, la app te pregunta
          antes de reemplazarla.
        </p>
        <p>La foto del ticket y el historial no viajan en el archivo.</p>
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
        <p>
          El archivo exportado se guarda donde vos elijas. La app no lo sube a
          ningún lado.
        </p>
      </HelpStepCard>

      <div className="mt-2">
        <HelpCta />
      </div>
    </div>
  );
}
