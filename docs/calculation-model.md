# Modelo de cálculo

Este documento describe las reglas canónicas de **¿Quién puso qué?**. Si una fórmula cambia, este archivo tiene que cambiar con ella.

## Entradas principales

`calculateBalances(eventData: EventData): CalculationResult`

`EventData` contiene:

- `eventName`
- `currency`
- `splitMode`
- `families`

`Family` contiene:

- `id`
- `name`
- `adults`: adultos (0 a 20)
- `minors`: menores (0 a 20); al menos una persona en total
- `paidAmount`
- `items` (opcional): desglose de lo que puso, `{ description, amount }[]`

## Lo que puso cada familia

Cada familia carga **cada cosa con lo que salió** ("Carne $ 10.000", "Hielo
$ 2.000") y la app calcula el total:

```text
paidAmount = suma de items[].amount   (redondeada a centavos)
```

- `paidAmount` es lo único que usa el motor de cálculo. `items` es el
  respaldo que se muestra en la lista, el ticket, el PDF y el WhatsApp.
- La suma la hace `sumContributionItems` (`lib/calculations/contributions.ts`).
  El formulario (`lib/forms/familyForm.ts`) la usa al guardar y el storage
  (`normalizeFamily` en `lib/storage/validators.ts`) la vuelve a calcular al
  leer un borrador o un archivo importado: nunca se confía en un total guardado.
- Un único monto sin descripción es solo un total: se guarda sin `items`.
- Una cosa con descripción y sin monto es un error de esa fila (si no costó
  nada, se carga 0). Las filas vacías se ignoran; sin ninguna cosa, la
  familia puso $0.
- Máximo `MAX_CONTRIBUTION_ITEMS` (12) cosas por familia.
- Versiones anteriores guardaban una nota libre (`notes`). Al leerla se
  convierte en el único ítem, con el total que tenía la familia.

## Resultado

`calculateBalances` devuelve un resultado discriminado:

```ts
{ ok: true; data: CalculationOutput }
{ ok: false; errors: ValidationError[] }
```

`CalculationOutput`:

| Campo | Descripción |
|---|---|
| `totalAmount` | suma de todos los `paidAmount` |
| `eligibleFamilyCount` | cantidad de familias habilitadas |
| `eligiblePersonCount` | cantidad de personas habilitadas |
| `splitMode` | criterio usado |
| `balances` | balance calculado por familia |
| `breakdown` | los pasos del reparto (`SplitBreakdown`, ver abajo) |

## Elegibilidad

Cada familia declara cuántos adultos y cuántos menores son. La elegibilidad
se calcula antes de repartir (`lib/calculations/eligibility.ts`).

| Condición | `isEligibleToPay` | `eligiblePersons` |
|---|---:|---:|
| `adults >= 1` | true | `adults + minors` |
| `adults = 0` (solo menores) | false | 0 |

Una familia sin adultos es **invitada**: no aporta y sus menores no entran en
ninguna cuenta. Queda con:

- `expectedShare = 0`
- `balance = paidAmount`
- `status = "guest"`

Siempre tiene `paidAmount = 0` y no tiene desglose. El formulario bloquea el
monto cuando no hay adultos, `validateFamily` rechaza otro valor con
`GUEST_PAID_AMOUNT` y, al recuperar un borrador viejo o un archivo importado
que lo traiga cargado, `normalizeFamily` lo pone en 0. Así ningún monto queda
sin reintegrar.

## Criterios

`SplitMode` tiene cuatro valores. La recomendación elige la base (por familia
o por persona); cuánto pagan los menores lo decide el grupo.

| `SplitMode` | En pantalla | Regla |
|---|---|---|
| `by-family` | Por familia | partes iguales por familia que aporta |
| `by-person` | Por persona · igual que los adultos (100%) | partes iguales por persona, adultos y menores |
| `by-person-minors-half` | Por persona · la mitad (50%) | cada menor paga la mitad de la parte por persona; lo que no pagan se reparte entre los adultos |
| `by-person-minors-zero` | Por persona · no pagan (0%) | el total se divide entre los adultos |

En todas las fórmulas, `A` y `M` son los adultos y menores de las familias
que aportan, `F` la cantidad de esas familias y `T` el gasto total.

El cálculo vive en `lib/calculations/calculateShareBreakdown.ts` y devuelve un
`SplitBreakdown` con cada paso. **Cada paso se redondea a centavos sobre los
montos ya redondeados**, así la cuenta que se muestra en el ticket, el PDF y
el WhatsApp cierra a la vista. Lo que le toca a una familia es
`adults × adultShare + minors × minorShare` (o `familyShare` por familia).

### Por familia

```text
familyShare = T / F
```

### Por persona, todos iguales (100%)

```text
personShare = T / (A + M)
adultShare = minorShare = personShare
```

### Por persona, menores al 50%

```text
personShare    = T / (A + M)                 parte igual por persona
minorShare     = personShare × 50%           lo que paga cada menor
minorsUnpaid   = M × (personShare − minorShare)   lo que no pagan los menores
adultSurcharge = minorsUnpaid / A            se reparte en partes iguales entre los adultos
adultShare     = personShare + adultSurcharge
```

Ejemplo (el del pedido): $12.000, 6 adultos y 2 menores.

```text
personShare    = 12.000 / 8 = 1.500
minorShare     = 750
minorsUnpaid   = 2 × 750 = 1.500
adultSurcharge = 1.500 / 6 = 250
adultShare     = 1.500 + 250 = 1.750

familia de 2 adultos y 1 menor = 2 × 1.750 + 1 × 750 = 4.250
familia de 1 adulto            = 1.750
control: 4.250 + 4.250 + 1.750 + 1.750 = 12.000
```

Ojo: no es lo mismo que contar a cada menor como media persona (eso daría
12.000 / 7 = $1.714,29 por adulto y $857,14 por menor). Acá el menor paga la
mitad de la parte igual y lo que falta lo absorben los adultos.

### Por persona, menores no pagan (0%)

```text
adultShare = T / A
minorShare = 0
```

Con el mismo ejemplo: 12.000 / 6 = 2.000 por adulto.

### Sin menores

Si no hay menores en las familias que aportan, las tres variantes por persona
dan exactamente lo mismo.

## Balance

```text
balance = paidAmount - expectedShare
```

| Condición | `status` | Significado |
|---|---|---|
| `!isEligibleToPay` | `guest` | no aporta |
| `balance > 0.005` | `receives` | cobra |
| `balance < -0.005` | `pays` | paga |
| `abs(balance) <= 0.005` | `balanced` | equilibrado |

`status` es canónico. Los componentes no deben reinterpretarlo.

## Validaciones

`calculateBalances` valida antes de calcular:

| Código | Caso |
|---|---|
| `NULL_SPLIT_MODE` | no hay criterio seleccionado |
| `NO_FAMILIES` | no hay familias |
| `MEMBERS_OUT_OF_RANGE` | adultos o menores fuera de 0 a 20, no enteros, o ninguna persona |
| `NEGATIVE_PAID_AMOUNT` | monto negativo o no finito |
| `GUEST_PAID_AMOUNT` | familia sin adultos con monto pagado mayor a 0 |
| `NO_ELIGIBLE_FAMILIES` | ninguna familia puede aportar |

Gasto total cero no es error. Si todos pagaron $0, todos quedan equilibrados salvo invitados no aportantes.

## Redondeo

Cada paso del reparto, las cuotas y los balances se redondean a 2 decimales:

```ts
Math.round(n * 100) / 100
```

Las transferencias se redondean luego a pesos enteros. Puede aparecer una discrepancia de redondeo de 0 o pocos pesos en casos no divisibles (por ejemplo, $10.000 con 2 adultos y 1 menor al 50% suman $10.000,01 de cuotas).

## Datos de versiones anteriores

Antes cada familia tenía `members` (1 a 5) y, si era una sola persona,
`singleMemberType`. Al leer un borrador, el historial o un archivo exportado
con ese formato, `normalizeFamily` lo convierte:

| Antes | Ahora |
|---|---|
| 1 adulto | 1 adulto, 0 menores |
| 1 menor | 0 adultos, 1 menor (invitada, como antes) |
| 2 o más integrantes | todos adultos |

Así cualquier cuenta vieja da el mismo resultado que daba. Si había menores en
una familia grande, se corrigen editando la familia.

## Transferencias

`calculateTransfers(balances: FamilyBalance[]): TransferResult`

Entrada: balances ya calculados.

Salida:

```ts
interface TransferResult {
  transfers: Transfer[];
  totalOwed: number;
  totalTransferred: number;
  roundingDiscrepancy: number;
}
```

Algoritmo:

1. Tomar deudores con `status = "pays"`.
2. Tomar acreedores con `status = "receives"`.
3. Convertir balances a pesos enteros con `Math.round`.
4. Ordenar de mayor a menor monto. En empate, ordenar por nombre.
5. Emparejar con greedy:

```text
amount = min(deudor.remaining, acreedor.remaining)
registrar transferencia
restar amount a ambos
avanzar el lado que llegó a cero
```

Familias `guest` y `balanced` no entran en transferencias.

## Ejemplo resumido

Total: $16.000. Criterio: `by-family`. Familias elegibles: 4.

```text
cuota = 16.000 / 4 = 4.000
```

| Familia | Pagó | Le tocaba | Balance | Estado |
|---|---:|---:|---:|---|
| Los García | $8.000 | $4.000 | +$4.000 | cobra |
| Los Rodríguez | $3.000 | $4.000 | -$1.000 | paga |
| Los López | $0 | $4.000 | -$4.000 | paga |
| Los Martínez | $0 | $0 | $0 | no aporta |
| Los Fernández | $5.000 | $4.000 | +$1.000 | cobra |

Transferencias:

- Los López le transfiere $4.000 a Los García.
- Los Rodríguez le transfiere $1.000 a Los Fernández.
