# Ejemplos

Los ejemplos sirven para validar cálculos, revisar textos y detectar regresiones. Los montos se muestran en pesos argentinos. Desde V1.3 todo se reparte **por persona, por porciones** (ver `docs/calculation-model.md`).

## Ejemplo 1: el asado de ejemplo, menores al 100%

Evento: **Asado del sábado** (`lib/flow/demoEvent.ts`).

| Familia | Adultos | Menores | Pagó |
|---|---:|---:|---:|
| Los García | 2 | 2 | $8.000 |
| Los Rodríguez | 2 | 0 | $3.000 |
| Los López | 1 | 0 | $0 |
| Los Martínez | 0 | 1 (vino solo, invitado) | $0 |
| Los Fernández | 2 | 1 | $5.000 |

Total: **$16.000**. Entran en la cuenta 4 familias: 7 adultos y 3 menores. Los
Martínez son un menor solo que no paga su parte: queda como `guest`.

```text
porciones = 7 × 1 + 3 × 1 = 10
precio    = 16.000 / 10 = 1.600 por persona
```

| Familia | Le tocaba | Balance | Estado |
|---|---:|---:|---|
| Los García | $6.400 | +$1.600 | cobra |
| Los Rodríguez | $3.200 | -$200 | paga |
| Los López | $1.600 | -$1.600 | paga |
| Los Martínez | $0 | $0 | no aporta |
| Los Fernández | $4.800 | +$200 | cobra |

Transferencias:

- Los López le transfiere $1.600 a Los García.
- Los Rodríguez le transfiere $200 a Los Fernández.

Es el ticket de muestra de la landing.

## Ejemplo 2: el mismo asado, menores al 50%

```text
porciones = 7 × 1 + 3 × ½ = 8,5
precio    = 16.000 / 8,5 = 1.882,35   → cada adulto
menor     = 1.882,35 / 2 = 941,18
```

| Familia | Cuenta | Le tocaba | Balance |
|---|---|---:|---:|
| Los García | 2 × $1.882,35 + 2 × $941,18 | $5.647,06 | +$2.352,94 |
| Los Rodríguez | 2 × $1.882,35 | $3.764,70 | -$764,70 |
| Los López | 1 × $1.882,35 | $1.882,35 | -$1.882,35 |
| Los Fernández | 2 × $1.882,35 + 1 × $941,18 | $4.705,88 | +$294,12 |

Transferencias (en pesos enteros): Los López → Los García $1.882; Los
Rodríguez → Los García $471; Los Rodríguez → Los Fernández $294.

## Ejemplo 3: el mismo asado, menores al 0%

```text
porciones = 7 (solo adultos)
precio    = 16.000 / 7 = 2.285,71 por adulto; los menores no pagan
```

Los García, Los Rodríguez y Los Fernández: 2 × $2.285,71 = $4.571,42. Los
López: $2.285,71.

## Ejemplo 4: 1 adulto + 1 menor (el caso que motivó las porciones)

$12.000. Los Pérez (2 adultos), Ana (1 adulta y 1 menor), Los Gómez (2
adultos y 2 menores).

| | Los Pérez | Ana | Los Gómez |
|---|---:|---:|---:|
| 100% (8 porciones, $1.500) | 3.000 | 3.000 | 6.000 |
| **50% (6,5 porciones, $1.846,15 / $923,08)** | 3.692,30 | **2.769,23** | 5.538,46 |
| 0% ($2.400 por adulto) | 4.800 | 2.400 | 4.800 |

Ana paga 1,5 porciones: su hijo paga exactamente la mitad que un adulto.
Comparación con reglas descartadas para el 50%:

- La otra mitad del menor la cubre su propia familia: Ana pagaría $3.000, lo
  mismo que al 100%.
- La otra mitad se reparte entre todos los adultos (V1.2): Ana $2.700, Los
  Pérez $3.900; el menor terminaba pagando menos de la mitad que un adulto.

## Ejemplo 5: menor que vino solo y paga su parte

Al grupo anterior se suma Juli (0 adultos, 1 menor) con "Va a pagar su
parte" marcado. Menores al 50%:

```text
porciones = 5 × 1 + 4 × ½ = 7
precio    = 12.000 / 7 = 1.714,29 → cada adulto
menor     = 857,15 (también Juli)
```

Juli no puso nada, así que debe su parte. En el ticket, el PDF y el WhatsApp
no "transfiere Juli": transfiere su tutor.

```text
Padre/madre o tutor encargado de Juli le transfiere $ 857 a Los Pérez
```

Si "Va a pagar su parte" no está marcado, Juli queda invitada: no paga, no
cobra y no cuenta como porción.

## Ejemplo 6: sin transferencias

| Familia | Adultos | Pagó |
|---|---:|---:|
| Familia A | 2 | $5.000 |
| Familia B | 2 | $5.000 |

```text
total = 10.000; 4 porciones de 2.500; cada familia 5.000
```

Las dos quedan equilibradas: no hace falta transferir.

## Ejemplo 7: texto para WhatsApp

Con el grupo del ejemplo 5 (menores al 50%):

```text
Asado

Gasto total: $ 12.000
Criterio usado: por persona, menores al 50%

Cómo se calculó:
- 5 adultos × 1 + 4 menores × ½ = 7 porciones
- 1 de los menores vino solo y paga su parte (a través de su padre, madre o tutor)
- $ 12.000 ÷ 7 porciones = $ 1.714,29 por porción: lo que paga cada adulto
- Cada menor paga media porción: $ 1.714,29 ÷ 2 = $ 857,15

Lo que puso cada uno:
- Los Pérez: $ 9.000
   · Carne: $ 7.000
   · Carbón: $ 2.000
- Ana: $ 0
- Los Gómez: $ 3.000 (Bebidas)
- Juli (menor solo): $ 0

Le toca a cada familia:
- Los Pérez: 2 adultos × $ 1.714,29 = $ 3.428,58
- Ana: 1 adulto × $ 1.714,29 + 1 menor × $ 857,15 = $ 2.571,44
- Los Gómez: 2 adultos × $ 1.714,29 + 2 menores × $ 857,15 = $ 5.142,88
- Juli (menor solo): 1 menor × $ 857,15 = $ 857,15

Transferencias sugeridas:
- Ana le transfiere $ 2.571 a Los Pérez
- Los Gómez le transfiere $ 2.143 a Los Pérez
- Padre/madre o tutor encargado de Juli le transfiere $ 857 a Los Pérez

Cobran:
- Los Pérez: $ 5.571,42

Pagan:
- Ana: $ 2.571,44
- Los Gómez: $ 2.142,88
- Juli (menor; padre/madre o tutor encargado de Juli): $ 857,15

Nota: Cada adulto cuenta una porción y cada menor media: un menor paga la mitad que un adulto. El total se divide por la cantidad de porciones.

Calculado con ¿Quién puso qué?
```

## Ejemplo 8: total desde el detalle

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

## Ejemplo 9: redondeo

| Familia | Adultos | Pagó |
|---|---:|---:|
| A | 1 | $10.000 |
| B | 1 | $0 |
| C | 1 | $0 |

```text
precio = 10.000 / 3 = 3.333,33
```

- A cobra $6.666,67; B y C pagan $3.333,33.
- Transferencias enteras: B le transfiere $3.333 a A; C le transfiere $3.333 a A.

Puede quedar una discrepancia de $1 por redondeo. Es esperable.

## Ejemplo 10: evento cerrado guardado en historial

Después de confirmar el resultado, el usuario toca `Guardar en el historial`.
La app guarda localmente una estructura de este estilo:

```ts
{
  id: "evt_123",
  eventName: "Asado del sábado",
  createdAt: "2026-11-16T18:00:00.000Z",
  closedAt: "2026-11-16T21:30:00.000Z",
  totalAmount: 16000,
  splitModeUsed: "by-person-minors-half",
  familiesSnapshot: [/* familias cargadas */],
  balancesSnapshot: [/* balances calculados */],
  transfersSnapshot: [/* transferencias sugeridas */],
  optionalNote: undefined
}
```

Las cuentas cerradas antes de V1.3 pueden tener `splitModeUsed: "by-family"`
y una sugerencia guardada: se siguen mostrando ("Reparto por familia") y la
sugerencia se descarta al leerlas.

## Ejemplo 11: ticket PDF

Contenido esperado con el grupo del ejemplo 5:

```text
¿Quién puso qué?                                Ticket final de cálculo
Asado

Resumen general
- Gasto total: $12.000,00      - Familias cargadas: 4   - Familias que aportan: 4
- Adultos + menores: 5 + 4     - Menores solos que pagan: 1
- Criterio usado: por persona, menores al 50%

Criterio usado
Se repartió por persona, menores al 50%. Cada adulto cuenta una porción y
cada menor media: un menor paga la mitad que un adulto. …

Cómo se calculó
› 5 adultos × 1 + 4 menores × ½ = 7 porciones
› 1 de los menores vino solo y paga su parte (a través de su padre, madre o tutor)
› $12.000,00 ÷ 7 porciones = $1.714,29 por porción: lo que paga cada adulto
› Cada menor paga media porción: $1.714,29 ÷ 2 = $857,15

Le toca a cada familia
› Ana: 1 adulto × $1.714,29 + 1 menor × $857,15 = $2.571,44
› Juli (menor solo): 1 menor × $857,15 = $857,15
…

Familias
Familia            Adul. Men. Pagó        Le toca     Balance     Estado
Los Pérez          2     0    $9.000,00   $3.428,58   $5.571,42   cobra
  · Carne                     $7.000,00
  · Carbón                    $2.000,00
Juli (menor solo)  0     1    $0,00       $857,15     -$857,15    paga

Transferencias sugeridas
Padre/madre o tutor encargado de Juli le transfiere $857,00 a Los Pérez
```

Si el usuario selecciona una foto, aparece arriba como portada de 190 × 64 mm,
recortada sin deformar. La imagen se usa solo para el PDF actual.
