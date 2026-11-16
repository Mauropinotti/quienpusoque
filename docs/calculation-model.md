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
- `paysOwnShare` (opcional): solo en familias sin adultos; el menor paga su parte a través de su padre, madre o tutor
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
| `adults = 0`, `paysOwnShare = true` (menores solos que pagan su parte) | true | `minors` |
| `adults = 0`, sin `paysOwnShare` (menores solos invitados) | false | 0 |

Una familia invitada queda con:

- `expectedShare = 0`
- `balance = paidAmount`
- `status = "guest"`

Siempre tiene `paidAmount = 0` y no tiene desglose. El formulario bloquea el
monto, `validateFamily` rechaza otro valor con `GUEST_PAID_AMOUNT` y, al
recuperar un borrador viejo o un archivo importado que lo traiga cargado,
`normalizeFamily` lo pone en 0.

Los menores solos que pagan su parte entran en la cuenta como cualquier
menor (con su fracción de porción). Pueden cargar lo que pusieron. En el
ticket, el PDF y el WhatsApp no figuran como quien transfiere o cobra: aparece
"padre/madre o tutor encargado de {nombre}".

Hace falta al menos un adulto entre las familias que entran en la cuenta; si
no, `calculateBalances` devuelve `NO_ELIGIBLE_FAMILIES`.

## Reparto por porciones

Desde V1.3 hay un solo criterio: **por persona, por porciones**. No hay
sugerencia automática ni reparto "por familia". El grupo elige cuánto cuenta
cada menor (`SplitMode`):

| `SplitMode` | En pantalla | Porción de cada menor |
|---|---|---:|
| `by-person` | Igual que un adulto (100%) | 1 |
| `by-person-minors-half` | La mitad (50%) | ½ |
| `by-person-minors-zero` | No pagan (0%) | 0 |

`A` y `M` son los adultos y menores que entran en la cuenta (incluidos los
menores solos que pagan su parte) y `T` el gasto total.

```text
porciones          = A + M × fracción
precio por porción = T / porciones          → lo que paga cada adulto (adultShare)
cada menor paga    = precio × fracción      → minorShare
cuota de la familia = adultos × adultShare + menores × minorShare
```

El cálculo vive en `lib/calculations/calculateShareBreakdown.ts` y devuelve un
`SplitBreakdown` (`portions`, `adultShare`, `minorShare`, …). Cada paso se
redondea a centavos, así la cuenta que se muestra en el ticket, el PDF y el
WhatsApp cierra a la vista.

### Por qué porciones

Cualquier descuento para un menor lo pagan los demás: el total es fijo. Con
porciones nadie "absorbe lo que no paga otro": todos pagan el mismo precio por
porción, y un menor al 50% paga **exactamente la mitad** que un adulto.

- **1 adulto + 1 menor** (el caso que motivó el cambio) paga 1,5 porciones.
- Cubrir el 50% del menor con los adultos de su propia familia daría lo mismo
  que el 100%; repartirlo entre todos los adultos (regla de V1.2) dejaba al
  menor pagando menos de la mitad que un adulto.

### Ejemplo

$12.000. Los Pérez (2 adultos), Ana (1 adulta + 1 menor), Los Gómez (2
adultos + 2 menores). Son 5 adultos y 3 menores.

| | Los Pérez | Ana | Los Gómez |
|---|---:|---:|---:|
| 100%: 8 porciones, $1.500 c/u | 3.000 | 3.000 | 6.000 |
| **50%: 6,5 porciones, $1.846,15 adulto, $923,08 menor** | 3.692,30 | **2.769,23** | 5.538,46 |
| 0%: 5 porciones, $2.400 por adulto | 4.800 | 2.400 | 4.800 |

Si además vino Juli (1 menor sola) y paga su parte, al 50% son 7 porciones:
$1.714,29 por adulto y $857,15 por menor; lo de Juli lo transfiere su padre,
madre o tutor.

Sin menores, las tres opciones dan lo mismo.

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
| `NULL_SPLIT_MODE` | no se eligió cómo pagan los menores |
| `NO_FAMILIES` | no hay familias |
| `MEMBERS_OUT_OF_RANGE` | adultos o menores fuera de 0 a 20, no enteros, o ninguna persona |
| `NEGATIVE_PAID_AMOUNT` | monto negativo o no finito |
| `GUEST_PAID_AMOUNT` | menores solos invitados con monto pagado mayor a 0 |
| `NO_ELIGIBLE_FAMILIES` | ninguna familia con adultos en la cuenta |

Gasto total cero no es error. Si todos pagaron $0, todos quedan equilibrados salvo invitados no aportantes.

## Redondeo

Cada paso del reparto, las cuotas y los balances se redondean a 2 decimales:

```ts
Math.round(n * 100) / 100
```

Las transferencias se redondean luego a pesos enteros. Puede aparecer una discrepancia de redondeo de 0 o pocos pesos en casos no divisibles (por ejemplo, con Juli al 50% el ejemplo de arriba suma $12.000,05 de cuotas).

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

Hasta V1.2 existían el criterio `by-family` y una sugerencia automática. Un
borrador o archivo que los traiga se lee igual: "por familia" queda sin
confirmar (el grupo vuelve a elegir cómo pagan los menores) y la aceptación
de la sugerencia se ignora. El historial conserva las cuentas cerradas "por
familia" y las muestra con ese nombre.

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

El asado de ejemplo (`lib/flow/demoEvent.ts`): $16.000, 7 adultos y 3 menores
en las familias que aportan; Los Martínez (1 menor solo, invitado) no entran.
Menores al 100%: 10 porciones de $1.600.

| Familia | Composición | Pagó | Le tocaba | Balance | Estado |
|---|---|---:|---:|---:|---|
| Los García | 2 adultos y 2 menores | $8.000 | $6.400 | +$1.600 | cobra |
| Los Rodríguez | 2 adultos | $3.000 | $3.200 | -$200 | paga |
| Los López | 1 adulto | $0 | $1.600 | -$1.600 | paga |
| Los Martínez | 1 menor (vino solo) | $0 | $0 | $0 | no aporta |
| Los Fernández | 2 adultos y 1 menor | $5.000 | $4.800 | +$200 | cobra |

Transferencias:

- Los López le transfiere $1.600 a Los García.
- Los Rodríguez le transfiere $200 a Los Fernández.
