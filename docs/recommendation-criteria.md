# Criterios de recomendación

## Función

```ts
recommendSplitMode(families: FamilyWithEligibility[]): SplitRecommendation
```

Analiza la composición del evento y devuelve:

```ts
{
  recommendedMode: "by-family" | "by-person";
  confidence:      "low" | "medium" | "high";
  reasons:         string[];   // en español, listos para mostrar en UI
  metrics:         RecommendationMetrics;
}
```

---

## Arquitectura: sistema de señales

La recomendación no es una secuencia de if/else. Funciona como un **sistema de señales con peso**:

1. Cada criterio que se cumple genera una **señal** con dirección (`by-person` o `by-family`) y peso (`2` moderado, `3` crítico).
2. Los pesos se suman por modo. El modo con mayor puntaje gana.
3. La **confianza** refleja la ventaja neta (diferencia de puntajes):
   - ventaja ≥ 3 → `high`
   - ventaja ≥ 1 → `medium`
   - empate o sin señales → `low`
4. Señales críticas (`weight 3`) siempre recomiendan `by-person` y nunca son superadas por señales de composición.

---

## Métricas calculadas

| Campo | Descripción |
|---|---|
| `eligibleFamilies` | Familias habilitadas para pagar |
| `eligiblePersons` | Personas habilitadas en total |
| `singleAdultFamilyRatio` | Proporción de familias de 1 adulto |
| `largeFamilyRatio` | Proporción de familias de 3-5 integrantes |
| `averageFamilySize` | Promedio de personas por familia elegible |
| `averageImpactBetweenModes` | Diferencia promedio entre modos / gasto total |
| `maxImpactBetweenModes` | Diferencia máxima entre modos / gasto total |

Métrica interna (no expuesta en `RecommendationMetrics`):

| Campo | Descripción |
|---|---|
| `sizeCoeffVar` | Coeficiente de variación de tamaños: `std(eligiblePersons) / mean`. 0 = todos igual. > 0.5 = muy heterogéneo. |

---

## Criterios (señales)

### [1] Dominancia de familias de 1 adulto → `by-person` (weight 2)

**Condición:** `singleAdultFamilyRatio ≥ 0.60`

Si la mayoría de las familias habilitadas son de 1 solo adulto, repartir por persona es conceptualmente más correcto y evita que las familias más chicas subsidien a las más grandes.

> Ejemplo: "Hay varias familias de 1 adulto (67%) y otras de mayor tamaño. Repartir por persona evita diferencias fuertes entre grupos."

---

### [2] Dominancia de familias numerosas → `by-family` (weight 2)

**Condición:** `largeFamilyRatio ≥ 0.60` AND `singleAdultFamilyRatio < 0.60`

Si la mayoría de las familias tiene 3 o más integrantes, repartir por familia simplifica sin generar grandes desigualdades.

**Guarda:** no aplica si hay dominancia de familias de 1 adulto (los criterios 1 y 2 son mutuamente excluyentes al ≥60%).

> Ejemplo: "La mayoría de las familias tiene entre 3 y 5 integrantes (80%). Repartir por familia es simple y equitativo para este grupo."

---

### [3] Impacto promedio alto → `by-person` (weight 2)

**Condición:** `averageImpactBetweenModes > 0.20`

Si la diferencia económica promedio entre los dos modos supera el 20% del gasto total, el impacto es suficientemente grande como para que el modo elegido importe. `by-person` distribuye de forma más equitativa.

> Ejemplo: "La diferencia económica promedio entre los dos criterios es del 28%, superando el 20%. Conviene repartir por persona para distribuir mejor la carga."

---

### [4] Impacto máximo alto → `by-person` (weight 3, crítico)

**Condición:** `maxImpactBetweenModes > 0.35`

Si una familia específica tendría una diferencia mayor al 35% del gasto total entre modos, el impacto individual es demasiado alto para ignorarlo. Esta señal es **crítica**: siempre recomienda `by-person` y no puede ser superada por señales de composición.

> Ejemplo: "Una familia tendría una diferencia del 38% del gasto total entre ambos criterios. Ese nivel de impacto individual es muy alto; repartir por persona lo nivela."

---

### [5] Impacto bajo + tamaños similares → `by-family` (weight 2)

**Condición:** `averageImpactBetweenModes ≤ 0.10` AND `sizeCoeffVar ≤ 0.30` AND `singleAdultFamilyRatio < 0.50`

Si la diferencia entre modos es pequeña (≤10%) y las familias tienen tamaños parecidos (CV ≤ 30%), repartir por familia simplifica sin afectar la equidad.

**Guarda:** no aplica cuando hay muchas familias de 1 adulto, para evitar señal contradictoria con [1].

> Ejemplo: "La mayoría de las familias tiene tamaños similares y la diferencia entre criterios es mínima (4%). Repartir por familia simplifica el cálculo sin afectar la equidad."

---

### Fallback (sin señales) → `by-family`, confianza `low`

Cuando ningún criterio se activa, la app sugiere `by-family` como la opción más simple, con confianza baja. El usuario puede elegir el modo que prefiera.

---

## Tabla de umbrales

| Umbral | Valor | Criterio |
|---|---|---|
| `SINGLE_ADULT_RATIO` | 0.60 | Señal [1] |
| `LARGE_FAMILY_RATIO` | 0.60 | Señal [2] |
| `MAX_IMPACT_HIGH` | 0.35 | Señal [4] |
| `AVG_IMPACT_HIGH` | 0.20 | Señal [3] |
| `AVG_IMPACT_LOW` | 0.10 | Señal [5] |
| `SIZE_COEFF_VAR_SIMILAR` | 0.30 | Señal [5] |
| `NET_FOR_HIGH` | 3 | Confianza alta |

---

## Ejemplos de recomendación

### Ejemplo A — by-person, confianza high (criterio 1 + criterio 4)

3 familias: 1 adulto, 1 adulto, 5 integrantes | Total $10.000

- `singleAdultFamilyRatio` = 0.67 → señal [1], weight=2
- `maxImpactBetweenModes` ≈ 0.38 > 0.35 → señal [4], weight=3 (crítica)
- `avgImpactBetweenModes` ≈ 0.25 > 0.20 → señal [3], weight=2
- personScore=7, familyScore=0, net=7 → **by-person, confianza high**
- Razones: 3 (señales 1, 4, 3)

---

### Ejemplo B — by-family, confianza high (criterios 2 + 5)

5 familias: 3, 3, 4, 4, 5 integrantes | Total $20.000

- `largeFamilyRatio` = 1.0 → señal [2], weight=2
- `avgImpactBetweenModes` ≈ 0.03 ≤ 0.10 AND `sizeCoeffVar` ≈ 0.20 ≤ 0.30 → señal [5], weight=2
- personScore=0, familyScore=4, net=4 → **by-family, confianza high**
- Razones: 2 (señales 2 y 5)

---

### Ejemplo C — by-person, confianza medium (criterio 1 solo)

5 familias: todas de 1 adulto | Total $15.000

- `singleAdultFamilyRatio` = 1.0 → señal [1], weight=2
- `avgImpactBetweenModes` ≈ 0 (by-family y by-person son equivalentes)
- personScore=2, familyScore=0, net=2 → **by-person, confianza medium**
- Razón: "Todas las familias habilitadas son de 1 solo adulto..."

---

### Ejemplo D — by-family, confianza low (sin señales)

4 familias: 1 adulto, 1 adulto, 4 integrantes, 5 integrantes | Total $16.000

- `singleAdultFamilyRatio` = 0.50 < 0.60 → señal [1] no aplica
- `largeFamilyRatio` = 0.50 < 0.60 → señal [2] no aplica
- `avgImpactBetweenModes` ≈ 0.16 (entre 0.10 y 0.20) → señales [3] y [5] no aplican
- `maxImpactBetweenModes` ≈ 0.21 < 0.35 → señal [4] no aplica
- Sin señales → **by-family, confianza low**
- Razón: "No encontramos diferencias significativas..."

---

### Ejemplo E — conflicto con resolución por impacto crítico

6 familias: 60% numerosas (3-5 integrantes), 1 familia de 5 con impacto máximo

- Señal [2] fires (largeFamilyRatio ≥ 60%): weight=2, by-family
- Señal [4] fires (maxImpact > 35%): weight=3, by-person (crítica)
- personScore=3, familyScore=2, net=1 → **by-person, confianza medium**
- Razón extra: "Aunque la composición del grupo podría sugerir otra cosa, el alto impacto económico individual es el factor determinante."

---

## Advertencias de diseño

1. **Criterios 1 y 2 son mutuamente excluyentes al ≥60%**: una familia no puede tener simultáneamente 1 y ≥3 integrantes, por lo que no pueden coexistir ambas dominancias.

2. **El criterio 4 es incancelable**: una señal de impacto máximo > 35% siempre recomienda `by-person`, independientemente de la composición. Es el criterio de mayor peso (3).

3. **La confianza refleja consenso, no certeza**: `high` significa que múltiples señales apuntan al mismo modo. No es una garantía; el usuario siempre puede elegir el criterio que prefiera.

4. **Gasto total cero**: si nadie pagó nada, los impactos son 0, ninguna señal económica aplica, y la recomendación cae al fallback (`by-family`, low).
