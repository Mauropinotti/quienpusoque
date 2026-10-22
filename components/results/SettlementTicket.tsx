import type { FamilyBalance, Transfer } from "@/types/calculation";
import { getUnitShare, type Settlement } from "@/lib/flow/eventInsights";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/components/ui/icons";

// Ticket de liquidación. Es presentacional (sin hooks): lo renderiza la
// landing como Server Component (0 KB de JS) y la app como Client Component.

interface SettlementTicketProps {
  eventName: string;
  currency: string;
  settlement: Settlement;
  /** "preview": quién puso + transferencias (landing). "full": balances completos. */
  variant?: "preview" | "full";
  dateLabel?: string;
  ticketNumber?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}

const MODE_LABEL = {
  "by-family": { mode: "por familia", unit: "c/ familia" },
  "by-person": { mode: "por persona", unit: "c/ persona" },
} as const;

export function SettlementTicket({
  eventName,
  currency,
  settlement,
  variant = "full",
  dateLabel,
  ticketNumber = "0001",
  className = "",
  headingLevel: Heading = "h2",
}: SettlementTicketProps) {
  const labels = MODE_LABEL[settlement.splitMode];

  return (
    <div className={`ticket-shadow ${className}`}>
      <article
        aria-label={`Ticket de ${eventName || "el evento"}`}
        className="ticket-edge bg-white px-5 pb-8 pt-8 text-ink sm:px-7"
      >
        <header className="text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-muted">
            ¿Quién puso qué? · Ticket N° {ticketNumber}
          </p>
          <Heading className="font-display mt-3 text-[1.9rem] break-words">
            {eventName || "Evento sin nombre"}
          </Heading>
          {dateLabel && (
            <p className="mt-2 font-mono text-xs text-muted">{dateLabel}</p>
          )}
        </header>

        <Divider />

        {variant === "preview" ? (
          <PaidList balances={settlement.balances} currency={currency} />
        ) : (
          <BalanceList balances={settlement.balances} currency={currency} />
        )}

        <div className="mt-3 flex items-baseline justify-between gap-3 font-mono">
          <span className="text-sm font-bold uppercase tracking-widest">Total</span>
          <span className="tabular text-2xl font-black" data-testid="ticket-total">
            {formatMoney(settlement.totalAmount, currency)}
          </span>
        </div>
        <p className="mt-1 text-right font-mono text-xs text-muted">
          Reparto {labels.mode} ·{" "}
          <span className="font-bold text-ink">
            {formatMoney(getUnitShare(settlement), currency)} {labels.unit}
          </span>
        </p>

        <Divider />

        <TransferList transfers={settlement.transfers} currency={currency} />

        <footer className="mt-6 text-center">
          <div
            aria-hidden="true"
            className="mx-auto h-9 w-48 bg-[repeating-linear-gradient(90deg,var(--color-ink)_0_2px,transparent_2px_4px,var(--color-ink)_4px_5px,transparent_5px_8px,var(--color-ink)_8px_11px,transparent_11px_12px)]"
          />
          <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            ¡Cuentas claras, amistades largas!
          </p>
        </footer>
      </article>
    </div>
  );
}

function Divider() {
  return <hr className="perforation my-5" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
      {children}
    </p>
  );
}

function PaidList({
  balances,
  currency,
}: {
  balances: FamilyBalance[];
  currency: string;
}) {
  return (
    <div>
      <SectionLabel>Lo que puso cada uno</SectionLabel>
      <ul className="space-y-1.5 font-mono text-sm">
        {balances.map((balance) => (
          <li key={balance.familyId} className="flex items-baseline gap-2">
            <span className="shrink-0">{balance.name}</span>
            <span
              aria-hidden="true"
              className="min-w-4 flex-1 translate-y-[-3px] border-b-2 border-dotted border-ink/25"
            />
            <span className="tabular shrink-0 font-bold">
              {balance.isEligibleToPay
                ? formatMoney(balance.paidAmount, currency)
                : "invitado"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BalanceList({
  balances,
  currency,
}: {
  balances: FamilyBalance[];
  currency: string;
}) {
  return (
    <div>
      <SectionLabel>Cómo quedó cada familia</SectionLabel>
      <ul className="divide-y-2 divide-dashed divide-ink/10">
        {balances.map((balance) => (
          <li
            key={balance.familyId}
            className="flex items-center justify-between gap-3 py-2.5"
            data-testid="ticket-balance"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate font-bold">{balance.name}</span>
                <Badge variant={balance.status} />
              </div>
              <p className="mt-0.5 font-mono text-xs text-muted">
                {balance.isEligibleToPay
                  ? `puso ${formatMoney(balance.paidAmount, currency)} · le tocaba ${formatMoney(balance.expectedShare, currency)}`
                  : "menor sin cargo, no entra en el reparto"}
              </p>
            </div>
            {balance.isEligibleToPay && (
              <span
                className={[
                  "tabular shrink-0 font-mono text-base font-black",
                  balance.status === "receives"
                    ? "text-chimi"
                    : balance.status === "pays"
                      ? "text-morron"
                      : "text-sky-text",
                ].join(" ")}
              >
                {balance.status === "receives" ? "+" : balance.status === "pays" ? "−" : ""}
                {formatMoney(Math.abs(balance.balance), currency)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TransferList({
  transfers,
  currency,
}: {
  transfers: Transfer[];
  currency: string;
}) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-chimi bg-chimi-soft px-4 py-3 text-center">
        <p className="font-bold text-chimi">Nadie le debe nada a nadie.</p>
        <p className="text-sm text-chimi">Mesa en paz, sobremesa tranquila.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Quién le pasa a quién</SectionLabel>
      <ol className="space-y-2">
        {transfers.map((transfer, index) => (
          <li
            key={`${transfer.fromFamilyId}-${transfer.toFamilyId}-${index}`}
            className="flex items-center gap-3 rounded-xl border-2 border-ink bg-paper px-3 py-2.5"
            data-testid="ticket-transfer"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-paper">
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-tight">
              <span className="font-bold">{transfer.fromFamilyName}</span>
              <ArrowRightIcon className="mx-1 inline-block align-[-2px] text-ember-text" />
              <span className="sr-only"> le transfiere a </span>
              <span className="font-bold">{transfer.toFamilyName}</span>
            </p>
            <span className="tabular shrink-0 font-mono text-base font-black">
              {formatMoney(transfer.amount, currency)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
