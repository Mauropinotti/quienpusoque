# Ejemplos

Los ejemplos sirven para validar cálculos, revisar textos y detectar regresiones. Los montos se muestran en pesos argentinos.

## Ejemplo 1: demo básica con reparto por familia

Evento: **Asado del sábado**

| Familia | Integrantes | Tipo | Pagó |
|---|---:|---|---:|
| Los García | 4 | - | $8.000 |
| Los Rodríguez | 2 | - | $3.000 |
| Los López | 1 | adulto | $0 |
| Los Martínez | 1 | menor | $0 |
| Los Fernández | 3 | - | $5.000 |

Total: **$16.000**.

Elegibles:

- 4 familias
- 10 personas
- Los Martínez queda como `guest`

### Cálculo

```text
cuota_por_familia = 16.000 / 4 = 4.000
```

| Familia | Pagó | Le tocaba | Balance | Estado |
|---|---:|---:|---:|---|
| Los García | $8.000 | $4.000 | +$4.000 | cobra |
| Los Rodríguez | $3.000 | $4.000 | -$1.000 | paga |
| Los López | $0 | $4.000 | -$4.000 | paga |
| Los Martínez | $0 | $0 | $0 | no aporta |
| Los Fernández | $5.000 | $4.000 | +$1.000 | cobra |

### Transferencias

Deudores:

- Los López: $4.000
- Los Rodríguez: $1.000

Acreedores:

- Los García: $4.000
- Los Fernández: $1.000

Resultado:

- Los López le transfiere $4.000 a Los García.
- Los Rodríguez le transfiere $1.000 a Los Fernández.

## Ejemplo 2: demo básica con reparto por persona

Mismo evento. Personas elegibles: 10.

```text
cuota_por_persona = 16.000 / 10 = 1.600
```

| Familia | Personas | Pagó | Le tocaba | Balance | Estado |
|---|---:|---:|---:|---:|---|
| Los García | 4 | $8.000 | $6.400 | +$1.600 | cobra |
| Los Rodríguez | 2 | $3.000 | $3.200 | -$200 | paga |
| Los López | 1 | $0 | $1.600 | -$1.600 | paga |
| Los Martínez | 0 | $0 | $0 | $0 | no aporta |
| Los Fernández | 3 | $5.000 | $4.800 | +$200 | cobra |

Transferencias:

- Los López le transfiere $1.600 a Los García.
- Los Rodríguez le transfiere $200 a Los Fernández.

## Ejemplo 3: sin transferencias

| Familia | Integrantes | Pagó |
|---|---:|---:|
| Familia A | 2 | $5.000 |
| Familia B | 2 | $5.000 |

Criterio: `by-family`.

```text
total = 10.000
cuota = 10.000 / 2 = 5.000
```

Balances:

- Familia A: equilibrado.
- Familia B: equilibrado.

Transferencias:

- No hace falta transferir.

## Ejemplo 4: menor no aportante

| Familia | Integrantes | Tipo | Pagó |
|---|---:|---|---:|
| Familia A | 2 | - | $6.000 |
| Familia B | 1 | adulto | $0 |
| Familia C | 1 | menor | $0 |

Criterio: `by-family`.

Familia C no aporta.

```text
total = 6.000
familias elegibles = 2
cuota = 3.000
```

Balances:

- Familia A cobra $3.000.
- Familia B paga $3.000.
- Familia C no aporta.

Transferencias:

- Familia B le transfiere $3.000 a Familia A.

## Ejemplo 5: texto para WhatsApp

Salida esperada aproximada:

```text
Asado del sábado

Gasto total: $16.000
Criterio usado: reparto por familia
Cuota por familia: $4.000

Transferencias sugeridas:
- Los López le transfiere $4.000 a Los García
- Los Rodríguez le transfiere $1.000 a Los Fernández

Cobran:
- Los García: $4.000
- Los Fernández: $1.000

Pagan:
- Los Rodríguez: $1.000
- Los López: $4.000

Invitados no aportantes:
- Los Martínez: menor sin cargo

Nota: Cada familia habilitada aporta una parte igual del gasto total.

Calculado con ¿Quién puso qué?
```

## Ejemplo 6: redondeo

| Familia | Integrantes | Pagó |
|---|---:|---:|
| A | 1 | $10.000 |
| B | 1 | $0 |
| C | 1 | $0 |

Criterio: `by-family`.

```text
cuota = 10.000 / 3 = 3.333,33
```

Balances:

- A cobra $6.666,67.
- B paga $3.333,33.
- C paga $3.333,33.

Transferencias enteras:

- B le transfiere $3.333 a A.
- C le transfiere $3.333 a A.

Puede quedar una discrepancia de $1 por redondeo. Es esperable.

## Ejemplo 7: evento cerrado guardado en historial

Después de confirmar el resultado del **Asado del sábado**, el usuario toca `Guardar evento cerrado`.

La app guarda localmente una estructura de este estilo:

```ts
{
  id: "evt_123",
  eventName: "Asado del sábado",
  createdAt: "2026-05-03T18:00:00.000Z",
  closedAt: "2026-05-03T21:30:00.000Z",
  totalAmount: 16000,
  splitModeUsed: "by-family",
  familiesSnapshot: [/* familias cargadas */],
  balancesSnapshot: [/* balances calculados */],
  transfersSnapshot: [/* transferencias sugeridas */],
  recommendationSnapshot: {/* recomendación usada como contexto */},
  optionalNote: undefined
}
```

Ese evento aparece en el historial del inicio con:

- nombre del evento
- fecha de cierre
- total
- criterio usado
- cantidad de familias
- detalle de transferencias al desplegar

Si se borra desde el historial, solo se elimina esa copia cerrada. El borrador actual no se modifica.

## Ejemplo 8: ticket PDF

Después de revisar resultados, el usuario puede tocar `Descargar ticket PDF`.

Contenido esperado del ticket:

```text
¿Quién puso qué?
Ticket final de cálculo

Asado del sábado
Generado el 2 may 2026, 21:30

Resumen general
- Gasto total: $16.000
- Familias cargadas: 5
- Familias habilitadas: 4
- Personas habilitadas: 10
- Criterio usado: por familia
- Recomendado: por familia
- Confianza: low / medium / high

Criterio usado
Se usó reparto por familia según la recomendación o elección del usuario.

Familias
Los García | 4 | pagó $8.000 | cuota $4.000 | cobra $4.000
Los Rodríguez | 2 | pagó $3.000 | cuota $4.000 | paga $1.000
Los Martínez | 1 menor | no aporta

Transferencias sugeridas
Los López le transfiere $4.000 a Los García
Los Rodríguez le transfiere $1.000 a Los Fernández

Este ticket fue generado localmente con ¿Quién puso qué?.
La app puede ser divertida. La cuenta no.
```

Si el usuario selecciona una foto, aparece arriba como portada simple. La imagen se usa solo para el PDF actual.
