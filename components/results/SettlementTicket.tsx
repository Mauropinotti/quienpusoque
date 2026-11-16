import type { FamilyBalance, Transfer } from "@/types/calculation";
import type { ContributionItem } from "@/types/family";
import { getContributionLabel } from "@/lib/calculations/contributions";
import type { Settlement } from "@/lib/flow/eventInsights";
import type { FamilyTicketDetail } from "@/lib/flow/ticketDetails";
import { formatMoney } from "@/lib/formatting/formatCurrency";
import {
  SPLIT_MODE_LABEL,
  describeSplitSteps,
  describeUnitShares,
} from "@/lib/text/describeSplit";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/components/ui/icons";

// Ticket de liquidación. Es presentacional (sin hooks): lo renderiza la
// landing como Server Component (0 KB de JS) y la app como Client Component.

interface SettlementTicketProps {
  eventName: string;
  currency: string;
  settlement: Settlement;
  /** Composición, lo que puso y la cuenta de cada familia, por id (ver `buildFamilyTicketDetails`). */
  details?: ReadonlyMap<string, FamilyTicketDetail>;
  /** "preview": quién puso + transferencias (landing). "full": balances completos. */
  variant?: "preview" | "full";
  dateLabel?: string;
  ticketNumber?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}

const NO_DETAILS: ReadonlyMap<string, FamilyTicketDetail> = new Map();

export function SettlementTicket({
  eventName,
  currency,
  settlement,
  details = NO_DETAILS,
  variant = "full",
  dateLabel,
  ticketNumber = "0001",
  className = "",
  headingLevel: Heading = "h2",
}: SettlementTicketProps) {
  const money = (amount: number) => formatMoney(amount, currency);
  const steps = variant === "full" ? describeSplitSteps(settlement.breakdown, money) : [];

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
          <PaidList balances={settlement.balances} details={details} currency={currency} />
        ) : (
          <BalanceList balances={settlement.balances} details={details} currency={currency} />
        )}

        <div className="mt-3 flex items-baseline justify-between gap-3 font-mono">
          <span className="text-sm font-bold uppercase tracking-widest">Total</span>
          <span className="tabular text-2xl font-black" data-testid="ticket-total">
            {formatMoney(settlement.totalAmount, currency)}
          </span>
        </div>
        <p className="mt-1 text-right font-mono text-xs text-muted">
          Reparto {SPLIT_MODE_LABEL[settlement.splitMode]} ·{" "}
          <span className="font-bold text-ink">
            {describeUnitShares(settlement.breakdown, money)}
          </span>
        </p>

        {steps.length > 0 && (
          <section aria-label="Cómo se repartió" className="mt-4 rounded-xl border-2 border-dashed border-ink/30 bg-paper px-3 py-2.5">
            <SectionLabel>Cómo se repartió</SectionLabel>
            <ol className="space-y-1 font-mono text-xs leading-snug" data-testid="ticket-steps">
              {steps.map((step) => (
                // La viñeta va por CSS: no se cuela al copiar ni al leer.
                <li
                  key={step}
                  className="relative break-words pl-4 before:absolute before:left-0 before:text-ember-text before:content-['›']"
                >
                  {step}
                </li>
              ))}
            </ol>
          </section>
        )}

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

interface ListProps {
  balances: FamilyBalance[];
  details: ReadonlyMap<string, FamilyTicketDetail>;
  currency: string;
}

/** Vista compacta (landing): el total y, debajo, qué trajo cada uno. */
function PaidList({ balances, details, currency }: ListProps) {
  return (
    <div>
      <SectionLabel>Lo que puso cada uno</SectionLabel>
      <ul className="space-y-1.5 font-mono text-sm">
        {balances.map((balance) => {
          const items = details.get(balance.familyId)?.items ?? [];
          return (
            <li key={balance.familyId}>
              <div className="flex items-baseline gap-2">
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
              </div>
              {items.length > 0 && (
                <p className="text-xs text-muted">
                  {items.map(getContributionLabel).join(" · ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Cada cosa con lo que salió, para que la suma se pueda chequear a ojo. */
function ContributionLines({
  items,
  currency,
}: {
  items: ContributionItem[];
  currency: string;
}) {
  return (
    <ul className="mt-1.5 space-y-0.5 font-mono text-xs text-ink-soft" data-testid="ticket-items">
      {items.map((item, index) => (
        <li key={index} className="flex items-baseline gap-2">
          <span className="min-w-0 break-words">{getContributionLabel(item)}</span>
          <span
            aria-hidden="true"
            className="min-w-3 flex-1 translate-y-[-3px] border-b border-dotted border-ink/30"
          />
          <span className="tabular shrink-0 font-bold text-ink">
            {formatMoney(item.amount, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function BalanceList({ balances, details, currency }: ListProps) {
  return (
    <div>
      <SectionLabel>Cómo quedó cada familia</SectionLabel>
      <ul className="divide-y-2 divide-dashed divide-ink/10">
        {balances.map((balance) => {
          const detail = details.get(balance.familyId);
          const items = detail?.items ?? [];
          return (
            <li key={balance.familyId} className="py-2.5" data-testid="ticket-balance">
              {/* Nombre y balance arriba; el detalle usa todo el ancho debajo. */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate font-bold">{balance.name}</span>
                  <Badge variant={balance.status} />
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
              </div>
              {detail?.composition && (
                <p className="mt-0.5 text-xs font-bold text-ink-soft">{detail.composition}</p>
              )}
              {items.length > 0 && <ContributionLines items={items} currency={currency} />}
              <p className={`font-mono text-xs text-muted ${items.length > 0 ? "mt-1.5" : "mt-0.5"}`}>
                {balance.isEligibleToPay
                  ? `puso ${formatMoney(balance.paidAmount, currency)} · le tocaba ${formatMoney(balance.expectedShare, currency)}`
                  : "sin adultos: no aporta ni entra en el reparto"}
              </p>
              {detail?.shareFormula && (
                <p className="font-mono text-xs text-muted" data-testid="ticket-share-formula">
                  = {detail.shareFormula}
                </p>
              )}
            </li>
          );
        })}
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
