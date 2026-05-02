# Modelo de cálculo

## API principal

```ts
calculateBalances(eventData: EventData): CalculationResult
```

Retorna un resultado discriminado:

```ts
{ ok: true;  data: CalculationOutput }
{ ok: false; errors: ValidationError[] }
```

`CalculationOutput` contiene:

| Campo | Tipo | Descripción |
|---|---|---|
| `totalAmount` | `number` | Suma de `paidAmount` de todas las familias |
| `eligibleFamilyCount` | `number` | Familias habilitadas para pagar |
| `eligiblePersonCount` | `number` | Personas habilitadas en total |
| `splitMode` | `SplitMode` | Modo usado para el cálculo |
| `balances` | `FamilyBalance[]` | Balance de cada familia |

---

## Elegibilidad

Se evalúa por familia **antes** de calcular cuotas.

| Condición | `isEligibleToPay` | `eligiblePersons` |
|---|---|---|
| `members = 1`, tipo = `adult` | `true` | `1` |
| `members = 1`, tipo = `minor` | `false` | `0` |
| `members ≥ 2` | `true` | `members` |

Las familias con `isEligibleToPay = false` reciben `expectedShare = 0` y `status = "guest"`.

---

## Reparto por familia (`by-family`)

```
cuota_por_familia = totalAmount / eligibleFamilyCount
```

Todas las familias elegibles pagan la misma cuota, sin importar cuántos son.

**Ejemplo:** total $16.000, 4 familias elegibles → cuota = $4.000 cada una.

---

## Reparto por persona (`by-person`)

```
cuota_por_persona = totalAmount / eligiblePersonCount
cuota_familia     = cuota_por_persona × family.eligiblePersons
```

La cuota de cada familia es proporcional a la cantidad de integrantes elegibles.

**Ejemplo:** total $16.000, 10 personas elegibles → $1.600/persona.
- Familia de 4 → $6.400
- Familia de 2 → $3.200
- Familia de 1 adulto → $1.600

---

## Balance

```
balance = paidAmount - expectedShare
```

| Condición | `status` | Significado |
|---|---|---|
| `!isEligibleToPay` | `"guest"` | Familia invitada, no aporta |
| `balance > 0.005` | `"receives"` | Puso de más, le deben |
| `balance < -0.005` | `"pays"` | Puso de menos, debe pagar |
| `\|balance\| ≤ 0.005` | `"balanced"` | Equilibrado |

El campo `status` en `FamilyBalance` es canónico. Los componentes lo usan directamente; no lo reinterpretan.

---

## Validaciones defensivas

`calculateBalances` valida antes de calcular. Cualquier error retorna `{ ok: false, errors }`.

| Código | Condición |
|---|---|
| `NULL_SPLIT_MODE` | `eventData.splitMode` es `null` |
| `NO_FAMILIES` | `eventData.families` está vacío |
| `MEMBERS_OUT_OF_RANGE` | `members < 1` o `members > 5` o no es entero |
| `NEGATIVE_PAID_AMOUNT` | `paidAmount < 0` o no es número finito |
| `MISSING_SINGLE_MEMBER_TYPE` | `members = 1` y `singleMemberType = null` |
| `NO_ELIGIBLE_FAMILIES` | Todas las familias son menores solos |

**Caso borde: gasto total cero** — no es un error. Si todas las familias pagaron $0, las cuotas son $0 y todos quedan en `"balanced"`.

---

## Redondeo

Todas las cuotas y balances se redondean a 2 decimales con `Math.round(n * 100) / 100`.

En grupos grandes con montos no divisibles puede quedar una diferencia de ±$0.01 por familia (el "problema del centavo"). Esta diferencia es cosmética y no afecta las transferencias.

---

## Transferencias (algoritmo greedy)

Ver `calculateTransfers.ts`.

1. Separar deudores (`balance < 0`) y acreedores (`balance > 0`).
2. Ordenar ambos grupos de mayor a menor (por valor absoluto).
3. Emparejar el deudor más grande con el acreedor más grande.
4. Registrar transferencia por `min(deuda, crédito)`.
5. Avanzar al siguiente cuando uno se agota.

Esto minimiza la cantidad de transferencias necesarias.

---

## Ejemplo completo

### Datos de entrada

| Familia | Integrantes | Tipo | Pagó |
|---|---|---|---|
| Los García | 4 | — | $8.000 |
| Los Rodríguez | 2 | — | $3.000 |
| Los López | 1 | Adulto | $0 |
| Los Martínez | 1 | Menor | $0 |
| Los Fernández | 3 | — | $5.000 |

**Total: $16.000** | **Elegibles: 4 familias, 10 personas** | **Martínez: guest**

---

### Por familia

```
cuota = 16.000 / 4 = 4.000
```

| Familia | Pagó | Le tocaba | Balance | Status |
|---|---|---|---|---|
| Los García | $8.000 | $4.000 | +$4.000 | receives |
| Los Rodríguez | $3.000 | $4.000 | −$1.000 | pays |
| Los López | $0 | $4.000 | −$4.000 | pays |
| Los Martínez | $0 | $0 | $0 | guest |
| Los Fernández | $5.000 | $4.000 | +$1.000 | receives |

**Transferencias:**
- Rodríguez → García: $1.000
- López → García: $3.000
- López → Fernández: $1.000

---

### Por persona

```
cuota_persona = 16.000 / 10 = 1.600
```

| Familia | Personas | Le tocaba | Pagó | Balance | Status |
|---|---|---|---|---|---|
| Los García | 4 | $6.400 | $8.000 | +$1.600 | receives |
| Los Rodríguez | 2 | $3.200 | $3.000 | −$200 | pays |
| Los López | 1 | $1.600 | $0 | −$1.600 | pays |
| Los Martínez | 0 | $0 | $0 | $0 | guest |
| Los Fernández | 3 | $4.800 | $5.000 | +$200 | receives |

**Transferencias:**
- López → García: $1.600
- Rodríguez → Fernández: $200
