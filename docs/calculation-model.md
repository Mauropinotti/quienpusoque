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
- `members`
- `singleMemberType`
- `paidAmount`
- `notes`

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

## Elegibilidad

La elegibilidad se calcula antes de repartir.

| Condición | `isEligibleToPay` | `eligiblePersons` |
|---|---:|---:|
| `members = 1`, `singleMemberType = adult` | true | 1 |
| `members = 1`, `singleMemberType = minor` | false | 0 |
| `members >= 2` | true | `members` |

Una familia no elegible queda con:

- `expectedShare = 0`
- `balance = paidAmount`
- `status = "guest"`

En el flujo normal, un menor solo debería tener `paidAmount = 0`. Si se carga otro valor, el status sigue siendo `guest`; no debe generar transferencias.

## Reparto por familia

```text
cuota_por_familia = totalAmount / eligibleFamilyCount
```

Todas las familias elegibles pagan la misma cuota.

Ejemplo:

```text
total = 16.000
familias elegibles = 4
cuota = 4.000
```

## Reparto por persona

```text
cuota_por_persona = totalAmount / eligiblePersonCount
cuota_familia = cuota_por_persona * eligiblePersons
```

Cada familia paga proporcionalmente a sus integrantes elegibles.

Ejemplo:

```text
total = 16.000
personas elegibles = 10
cuota_por_persona = 1.600
familia de 4 = 6.400
familia de 2 = 3.200
familia de 1 adulto = 1.600
```

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
| `MEMBERS_OUT_OF_RANGE` | integrantes fuera de 1 a 5 o no entero |
| `NEGATIVE_PAID_AMOUNT` | monto negativo o no finito |
| `MISSING_SINGLE_MEMBER_TYPE` | familia de 1 integrante sin tipo |
| `NO_ELIGIBLE_FAMILIES` | ninguna familia puede aportar |

Gasto total cero no es error. Si todos pagaron $0, todos quedan equilibrados salvo invitados no aportantes.

## Redondeo

Balances y cuotas se redondean a 2 decimales:

```ts
Math.round(n * 100) / 100
```

Las transferencias se redondean luego a pesos enteros. Puede aparecer una discrepancia de redondeo de 0 o pocos pesos en casos no divisibles.

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
