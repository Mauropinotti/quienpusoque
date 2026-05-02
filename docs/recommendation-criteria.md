# Criterios de recomendación

El motor evalúa ambos modos y aplica estas reglas en orden de prioridad:

## Reglas

| # | Condición | Recomendación | Confianza |
|---|-----------|---------------|-----------|
| 1 | ≥60% familias son de 1 adulto | by-person | high |
| 2 | maxImpactDiff > 35% del total | by-person | high |
| 3 | avgImpactDiff > 20% del total | by-person | medium |
| 4 | ≥60% familias grandes (3-5) + avgImpact ≤ 20% | by-family | medium |
| 5 | Tamaños similares + avgImpact ≤ 20% | by-family | medium |
| 6 | Sin diferencia clara | by-family | low |

## Métricas calculadas

- `singleAdultFamiliesRatio`: proporción de familias de 1 adulto
- `largeFamiliesRatio`: proporción de familias de 3 a 5 integrantes
- `avgMembersPerEligibleFamily`: promedio de integrantes entre familias elegibles
- `avgImpactDiff`: diferencia promedio absoluta entre modos / gasto total
- `maxImpactDiff`: diferencia máxima absoluta entre modos / gasto total
