# Criterios de recomendación

El motor de recomendación vive en `lib/calculations/recommendSplitMode.ts`.

Su trabajo es sugerir un criterio de reparto, no imponerlo. La UI siempre permite elegir manualmente.

## API

```ts
recommendSplitMode(families: FamilyWithEligibility[]): SplitRecommendation
```

Devuelve:

```ts
{
  recommendedMode: "by-family" | "by-person";
  confidence: "low" | "medium" | "high";
  reasons: string[];
  metrics: RecommendationMetrics;
}
```

## Idea general

El motor usa señales ponderadas:

1. Calcula métricas del grupo.
2. Evalúa criterios.
3. Cada criterio genera una señal a favor de `by-family` o `by-person`.
4. Suma puntajes.
5. Devuelve el modo ganador y una confianza.

## Métricas

| Métrica | Descripción |
|---|---|
| `eligibleFamilies` | familias habilitadas para pagar |
| `eligiblePersons` | personas habilitadas |
| `singleAdultFamilyRatio` | proporción de familias de 1 adulto |
| `largeFamilyRatio` | proporción de familias de 3 a 5 integrantes |
| `averageFamilySize` | promedio de integrantes elegibles |
| `averageImpactBetweenModes` | impacto promedio entre criterios sobre el total |
| `maxImpactBetweenModes` | impacto máximo individual entre criterios sobre el total |

Métrica interna:

| Métrica | Descripción |
|---|---|
| `sizeCoeffVar` | coeficiente de variación de tamaños |

## Señales

### 1. Muchas familias de 1 adulto

Condición:

```text
singleAdultFamilyRatio >= 0.60
```

Señal: `by-person`, peso 2.

Razón: si hay muchas familias de una persona y otras más grandes, repartir por persona evita que las chicas subsidien a las grandes.

### 2. Muchas familias numerosas

Condición:

```text
largeFamilyRatio >= 0.60
singleAdultFamilyRatio < 0.60
```

Señal: `by-family`, peso 2.

Razón: si casi todos los grupos son grandes, por familia simplifica sin alterar demasiado la equidad.

### 3. Impacto promedio alto

Condición:

```text
averageImpactBetweenModes > 0.20
```

Señal: `by-person`, peso 2.

Razón: si el promedio de diferencia entre criterios es alto, conviene usar el criterio más proporcional.

### 4. Impacto máximo alto

Condición:

```text
maxImpactBetweenModes > 0.35
```

Señal: `by-person`, peso 3.

Razón: si una familia queda muy afectada por el criterio elegido, el sistema prioriza repartir por persona.

### 5. Impacto bajo y tamaños similares

Condición:

```text
averageImpactBetweenModes <= 0.10
sizeCoeffVar <= 0.30
singleAdultFamilyRatio < 0.50
```

Señal: `by-family`, peso 2.

Razón: si casi no cambia el resultado, conviene el criterio más simple.

## Confianza

La confianza depende de la ventaja neta entre puntajes:

| Caso | Confianza |
|---|---|
| ventaja neta >= 3 | high |
| ventaja neta >= 1 | medium |
| empate o sin señales | low |

Si no hay señales, el fallback es `by-family` con confianza baja.

## Umbrales

| Constante | Valor |
|---|---:|
| `SINGLE_ADULT_RATIO` | 0.60 |
| `LARGE_FAMILY_RATIO` | 0.60 |
| `MAX_IMPACT_HIGH` | 0.35 |
| `AVG_IMPACT_HIGH` | 0.20 |
| `AVG_IMPACT_LOW` | 0.10 |
| `SIZE_COEFF_VAR_SIMILAR` | 0.30 |
| `NET_FOR_HIGH` | 3 |

## Ejemplos

### by-person con confianza alta

Grupo: dos familias de 1 adulto y una familia de 5.

- muchas familias de 1 adulto
- impacto promedio alto
- impacto máximo alto

Resultado: `by-person`, confianza alta.

### by-family con confianza alta

Grupo: cinco familias de 3 a 5 integrantes y tamaños parecidos.

- muchas familias numerosas
- impacto bajo
- tamaños similares

Resultado: `by-family`, confianza alta.

### by-family con confianza baja

Grupo mixto sin dominancias claras y con impacto medio.

- no se activan señales fuertes

Resultado: `by-family`, confianza baja por simpleza.

## Advertencias

- La recomendación no reemplaza el acuerdo del grupo.
- Los textos de `reasons` se muestran en UI; deben ser claros y cortos.
- Si cambia un umbral, actualizar README y ejemplos.
- Si cambia una señal, actualizar este documento y revisar casos de borde.
