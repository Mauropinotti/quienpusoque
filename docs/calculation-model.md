# Modelo de cálculo

## Elegibilidad

Cada familia tiene una elegibilidad calculada antes del reparto:

| Condición | isEligibleToPay | eligiblePersons |
|-----------|-----------------|-----------------|
| members = 1, tipo = adult | true | 1 |
| members = 1, tipo = minor | false | 0 |
| members ≥ 2 | true | members |

## Reparto por familia (by-family)

```
cuota_por_familia = gasto_total / cantidad_familias_elegibles
balance = monto_pagado - cuota_por_familia
```

## Reparto por persona (by-person)

```
cuota_por_persona = gasto_total / total_personas_elegibles
cuota_familia = cuota_por_persona × integrantes_elegibles_de_familia
balance = monto_pagado - cuota_familia
```

## Balance

- `balance > 0` → la familia cobró de más → **cobra**
- `balance < 0` → la familia pagó de menos → **paga**
- `balance = 0` → equilibrado

## Transferencias (algoritmo greedy)

Se ordena por monto adeudado (mayor a menor). Se empareja el deudor más grande con el acreedor más grande, se registra la transferencia por el mínimo de ambos, y se avanza.

Esto minimiza la cantidad de transferencias.
