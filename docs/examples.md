# Ejemplos

## Ejemplo 1 — Demo básica (5 familias, by-family)

| Familia | Integrantes | Tipo | Pagó |
|---|---|---|---|
| Los García | 4 | — | $8.000 |
| Los Rodríguez | 2 | — | $3.000 |
| Los López | 1 | Adulto | $0 |
| Los Martínez | 1 | Menor | $0 |
| Los Fernández | 3 | — | $5.000 |

**Total: $16.000** | 4 familias elegibles | Martínez: guest (1 menor)

### Balances `by-family`

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

### Transferencias

Deudores (mayor a menor): López $4.000, Rodríguez $1.000
Acreedores (mayor a menor): García $4.000, Fernández $1.000

```
Paso 1: López(4000)     → García(4000)    → amount=4000. Ambos a 0.
Paso 2: Rodríguez(1000) → Fernández(1000) → amount=1000. Ambos a 0.
```

**Resultado: 2 transferencias**
- López → García: $4.000
- Rodríguez → Fernández: $1.000

`totalOwed = 5.000` | `totalTransferred = 5.000` | `roundingDiscrepancy = 0`

---

## Ejemplo 2 — Demo básica (5 familias, by-person)

Mismo evento. 10 personas elegibles (4+2+1+3, Martínez excluido).

```
cuota_por_persona = 16.000 / 10 = 1.600
```

| Familia | Personas | Le tocaba | Pagó | Balance | Status |
|---|---|---|---|---|---|
| Los García | 4 | $6.400 | $8.000 | +$1.600 | receives |
| Los Rodríguez | 2 | $3.200 | $3.000 | −$200 | pays |
| Los López | 1 | $1.600 | $0 | −$1.600 | pays |
| Los Martínez | 0 | $0 | $0 | $0 | guest |
| Los Fernández | 3 | $4.800 | $5.000 | +$200 | receives |

### Transferencias

Deudores: López $1.600, Rodríguez $200
Acreedores: García $1.600, Fernández $200

```
Paso 1: López(1600)     → García(1600)    → amount=1600. Ambos a 0.
Paso 2: Rodríguez(200)  → Fernández(200)  → amount=200.  Ambos a 0.
```

**Resultado: 2 transferencias**
- López → García: $1.600
- Rodríguez → Fernández: $200

`totalOwed = 1.800` | `totalTransferred = 1.800` | `roundingDiscrepancy = 0`

---

## Ejemplo 3 — Acreedores grandes, muchos deudores iguales

Evento con 2 familias que pusieron casi todo y 8 que pusieron poco o nada.

| Familia | Pagó | Balance | Status |
|---|---|---|---|
| Familia A | $68.000 | +$68.000 | receives |
| Familia B | $28.000 | +$28.000 | receives |
| Familia 01 | $0 | −$12.000 | pays |
| Familia 02 | $0 | −$12.000 | pays |
| Familia 03 | $0 | −$12.000 | pays |
| Familia 04 | $0 | −$12.000 | pays |
| Familia 05 | $0 | −$12.000 | pays |
| Familia 06 | $0 | −$12.000 | pays |
| Familia 07 | $0 | −$12.000 | pays |
| Familia 08 | $0 | −$12.000 | pays |

**Total adeudado: $96.000**

Deudores ordenados: Fam01…Fam08 ($12.000 c/u, desempate por nombre)
Acreedores ordenados: [A=$68.000, B=$28.000]

```
Paso 1: Fam01(12000) → A(68000) → 12000. Fam01:0, A:56000.
Paso 2: Fam02(12000) → A(56000) → 12000. Fam02:0, A:44000.
Paso 3: Fam03(12000) → A(44000) → 12000. Fam03:0, A:32000.
Paso 4: Fam04(12000) → A(32000) → 12000. Fam04:0, A:20000.
Paso 5: Fam05(12000) → A(20000) → 12000. Fam05:0, A:8000.
Paso 6: Fam06(12000) → A(8000)  → 8000.  A:0, Fam06:4000.  ← A agotado, ci++
Paso 7: Fam06(4000)  → B(28000) → 4000.  Fam06:0, B:24000.
Paso 8: Fam07(12000) → B(24000) → 12000. Fam07:0, B:12000.
Paso 9: Fam08(12000) → B(12000) → 12000. Ambos:0.
```

**Resultado: 9 transferencias** (óptimo: N+M−1 = 8+2−1 = 9)

| De | A | Monto |
|---|---|---|
| Fam01 | Familia A | $12.000 |
| Fam02 | Familia A | $12.000 |
| Fam03 | Familia A | $12.000 |
| Fam04 | Familia A | $12.000 |
| Fam05 | Familia A | $12.000 |
| Fam06 | Familia A | $8.000 |
| Fam06 | Familia B | $4.000 |
| Fam07 | Familia B | $12.000 |
| Fam08 | Familia B | $12.000 |

`totalOwed = 96.000` | `totalTransferred = 96.000` | `roundingDiscrepancy = 0`

---

## Ejemplo 4 — Redondeo sub-peso (3 familias iguales)

| Familia | Pagó | Total split |
|---|---|---|
| A | $10.000 | — |
| B | $0 | — |
| C | $0 | — |

**Total: $10.000** | Reparto `by-family`

```
cuota = 10.000 / 3 = 3.333,33... → round2 = 3.333,33
```

Balances:
- A: +$6.666,67 (receives)
- B: −$3.333,33 (pays)
- C: −$3.333,33 (pays)

**Conversión a pesos enteros:**
- A acreedor: `round(6.666,67) = 6.667`
- B deudor: `round(3.333,33) = 3.333`
- C deudor: `round(3.333,33) = 3.333`

`totalOwed = 6.666` | `totalExpected = 6.667` → `roundingDiscrepancy = 1` peso

```
Paso 1: B(3333) → A(6667) → 3333. A:3334.
Paso 2: C(3333) → A(3334) → 3333. C:0, A:1. (el peso residual queda en A)
```

**Resultado: 2 transferencias**
- B → A: $3.333
- C → A: $3.333

`totalTransferred = 6.666` | A recibe $1 menos que su balance exacto — diferencia de redondeo inevitable y aceptable.
