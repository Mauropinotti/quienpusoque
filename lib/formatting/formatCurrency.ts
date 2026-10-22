// Construir un Intl.NumberFormat es caro (carga datos de locale). Antes se
// creaba uno por cada monto renderizado; ahora se reutiliza por moneda y
// cantidad de decimales.
const formatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(
  currency: string,
  fractionDigits: number
): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let formatter = formatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, formatter);
  }

  return formatter;
}

function hasCents(amount: number): boolean {
  return Math.abs(Math.round(amount * 100) % 100) > 0;
}

/** Siempre con 2 decimales: tablas formales como el ticket PDF. */
export function formatCurrency(amount: number, currency = "ARS"): string {
  return getCurrencyFormatter(currency, 2).format(amount);
}

/** Muestra centavos solo si existen: $ 8.000 o $ 1.333,33. */
export function formatMoney(amount: number, currency = "ARS"): string {
  return getCurrencyFormatter(currency, hasCents(amount) ? 2 : 0).format(
    amount
  );
}
