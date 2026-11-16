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
          <li>cuántos adultos y cuántos menores son (y, si vinieron menores solos, si pagan su parte)</li>
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
          Si vinieron <strong>menores solos</strong> (sin adultos), marcás si{" "}
          <strong>van a pagar su parte</strong>: la paga su padre, madre o tutor, y
          en el ticket aparece así: “Padre/madre o tutor encargado de Juli le
          transfiere…”. Si no la marcás, quedan invitados: no pagan ni cobran.
        </p>
      </HelpStepCard>

      <EligibilityCriteriaCard />

      <HelpStepCard number="03" title="¿Cómo pagan los menores?" tone="sky">
        <p>
          Todo se reparte <strong>por porciones</strong>: cada adulto cuenta una
          porción entera y cada menor, la parte que elijan:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Igual que un adulto (100%).</strong> Cada menor es una porción
            entera: todos pagan lo mismo.
          </li>
          <li>
            <strong>La mitad (50%).</strong> Cada menor es media porción: paga la
            mitad que un adulto.
          </li>
          <li>
            <strong>No pagan (0%).</strong> Los menores no cuentan: el total se
            divide entre los adultos.
          </li>
        </ul>
        <p>El total se divide por la cantidad de porciones y eso paga cada adulto.</p>
        <p className="font-mono text-sm leading-relaxed">
          $12.000 · Los Pérez (2 adultos), Ana (1 adulta y 1 menor), Los Gómez
          (2 adultos y 2 menores), menores al 50%:
          <br />
          5 adultos × 1 + 3 menores × ½ = 6,5 porciones
          <br />
          $12.000 ÷ 6,5 = $1.846,15 por adulto · $923,08 por menor
          <br />
          Ana: $1.846,15 + $923,08 = $2.769,23
        </p>
        <p>
          Nadie paga “lo que no paga otro”: todos pagan el mismo precio por
          porción. El ticket, el PDF y el WhatsApp muestran esta cuenta paso a
          paso, y lo que le toca a cada familia.
        </p>
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
