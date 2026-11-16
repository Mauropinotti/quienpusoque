# Ejemplos

Los ejemplos sirven para validar cálculos, revisar textos y detectar regresiones. Los montos se muestran en pesos argentinos.

## Ejemplo 1: demo básica con reparto por familia

Evento: **Asado del sábado**

| Familia | Adultos | Menores | Pagó |
|---|---:|---:|---:|
| Los García | 2 | 2 | $8.000 |
| Los Rodríguez | 2 | 0 | $3.000 |
| Los López | 1 | 0 | $0 |
| Los Martínez | 0 | 1 | $0 |
| Los Fernández | 2 | 1 | $5.000 |

Total: **$16.000**.

Aportan:

- 4 familias
- 7 adultos y 3 menores (10 personas)
- Los Martínez (sin adultos) queda como `guest`

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

## Ejemplo 2: demo básica por persona, todos iguales (100%)

Mismo evento. 7 adultos + 3 menores = 10 personas.

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

## Ejemplo 2b: menores al 50%

$12.000. Los Pérez (2 adultos y 1 menor) pusieron $9.000, Los Gómez (2 y 1)
$3.000, Ana (1 adulto) y Los Ruiz (1 adulto) nada. Juli vino sola (1 menor,
sin adultos): no aporta. Aportan 6 adultos y 2 menores.

```text
parte igual        = 12.000 / 8 = 1.500 por persona
cada menor paga    = 1.500 × 50% = 750
no pagan los menores = 2 × 750 = 1.500
se reparte entre 6 adultos = 1.500 / 6 = 250 más cada uno
cada adulto paga   = 1.500 + 250 = 1.750
```

| Familia | Cuenta | Le tocaba | Pagó | Balance |
|---|---|---:|---:|---:|
| Los Pérez | 2 × $1.750 + 1 × $750 | $4.250 | $9.000 | +$4.750 |
| Los Gómez | 2 × $1.750 + 1 × $750 | $4.250 | $3.000 | -$1.250 |
| Ana | 1 × $1.750 | $1.750 | $0 | -$1.750 |
| Los Ruiz | 1 × $1.750 | $1.750 | $0 | -$1.750 |
| Juli | sin adultos | $0 | $0 | no aporta |

Transferencias: Ana y Los Ruiz le pasan $1.750 cada uno a Los Pérez y Los
Gómez, $1.250.

## Ejemplo 2c: menores no pagan (0%)

Mismo grupo: `12.000 / 6 adultos = 2.000` por adulto.

| Familia | Cuenta | Le tocaba |
|---|---|---:|
| Los Pérez | 2 × $2.000 + 1 × $0 | $4.000 |
| Los Gómez | 2 × $2.000 + 1 × $0 | $4.000 |
| Ana | 1 × $2.000 | $2.000 |
| Los Ruiz | 1 × $2.000 | $2.000 |

## Ejemplo 3: sin transferencias

| Familia | Adultos | Pagó |
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

## Ejemplo 4: familia sin adultos

| Familia | Adultos | Menores | Pagó |
|---|---:|---:|---:|
| Familia A | 2 | 0 | $6.000 |
| Familia B | 1 | 0 | $0 |
| Familia C | 0 | 1 | $0 |

Criterio: `by-family`.

Familia C no tiene adultos: no aporta y su menor no entra en la cuenta.

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

Con el grupo del ejemplo 2b (menores al 50%). Salida esperada aproximada:

```text
Asado

Gasto total: $12.000
Criterio usado: por persona, menores al 50%

Cómo se calculó:
- 6 adultos + 2 menores = 8 personas
- Parte igual: $12.000 ÷ 8 = $1.500 por persona
- Cada menor paga el 50%: $750
- Lo que no pagan los menores: 2 × $750 = $1.500
- Se reparte entre los 6 adultos: $1.500 ÷ 6 = $250 más cada uno
- Cada adulto paga: $1.500 + $250 = $1.750

Lo que puso cada uno:
- Los Pérez: $9.000
   · Carne: $7.000
   · Carbón: $2.000
- Los Gómez: $3.000 (Bebidas)
- Ana: $0
- Los Ruiz: $0

Le toca a cada familia:
- Los Pérez: 2 adultos × $1.750 + 1 menor × $750 = $4.250
- Los Gómez: 2 adultos × $1.750 + 1 menor × $750 = $4.250
- Ana: 1 adulto × $1.750 = $1.750
- Los Ruiz: 1 adulto × $1.750 = $1.750

Transferencias sugeridas:
- Ana le transfiere $1.750 a Los Pérez
- Los Ruiz le transfiere $1.750 a Los Pérez
- Los Gómez le transfiere $1.250 a Los Pérez

Cobran:
- Los Pérez: $4.750

Pagan:
- Los Gómez: $1.250
- Ana: $1.750
- Los Ruiz: $1.750

No aportan (sin adultos):
- Juli: 1 menor, sin cargo

Nota: Cada menor paga el 50% de la parte por persona; lo que no pagan los menores se reparte en partes iguales entre los adultos.

Calculado con ¿Quién puso qué?
```

Por familia, "Cómo se calculó" es una sola línea (`$16.000 ÷ 4 familias =
$4.000 por familia`) y no hay sección "Le toca a cada familia": es la misma
parte para todas.

## Ejemplo 6: total desde el detalle

Los Pérez cargan cada cosa con lo que salió:

| Qué puso | Cuánto salió |
|---|---:|
| Carne | $10.000 |
| Hielo | $2.000 |
| Pan | $1.500,50 |

```text
paidAmount = 10.000 + 2.000 + 1.500,50 = 13.500,50
```

El total lo calcula la app (`sumContributionItems`); el usuario no lo tipea.
A partir de ahí, el reparto usa `paidAmount` como en los ejemplos anteriores.

## Ejemplo 7: redondeo

| Familia | Adultos | Pagó |
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

## Ejemplo 8: evento cerrado guardado en historial

Después de confirmar el resultado del **Asado del sábado**, el usuario toca `Guardar en el historial`.

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

## Ejemplo 9: ticket PDF

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
- Familias que aportan: 4
- Adultos + menores: 7 + 3
- Criterio usado: por familia
- Recomendado: por familia

Criterio usado
Se repartió por familia. La app recomendó repartir por familia: …

Cómo se calculó
› $16.000,00 ÷ 4 familias = $4.000,00 por familia

(Por persona se agregan los pasos y "Le toca a cada familia", ver ejemplos
2b y 5.)

Familias
Los García | 2 adultos | 2 menores | pagó $8.000 | le toca $4.000 | cobra $4.000
  · Carne          $6.500
  · Carbón         $1.500
Los Rodríguez | 2 adultos | 0 menores | pagó $3.000 | le toca $4.000 | paga $1.000
  · Bebidas        $3.000
Los Martínez | 0 adultos | 1 menor | no aporta

Transferencias sugeridas
Los López le transfiere $4.000 a Los García
Los Rodríguez le transfiere $1.000 a Los Fernández

Este ticket fue generado localmente con ¿Quién puso qué?. ¡Cuentas claras siempre!
desarrollado por MauroHP - Lista 127 8B 2026.-
```

Si el usuario selecciona una foto, aparece arriba como portada de 190 × 64 mm, recortada sin deformar. La imagen se usa solo para el PDF actual.
