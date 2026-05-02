# Ejemplos

## Ejemplo base (datos de demo)

| Familia | Integrantes | Tipo | Pagó |
|---------|-------------|------|------|
| Los García | 4 | — | $8.000 |
| Los Rodríguez | 2 | — | $3.000 |
| Los López | 1 | Adulto | $0 |
| Los Martínez | 1 | Menor | $0 |
| Los Fernández | 3 | — | $5.000 |

**Total: $16.000**

### Por familia (4 familias elegibles, Martínez excluida)

```
Cuota por familia = 16.000 / 4 = 4.000
```

| Familia | Pagó | Le tocaba | Balance |
|---------|------|-----------|---------|
| Los García | 8.000 | 4.000 | +4.000 (cobra) |
| Los Rodríguez | 3.000 | 4.000 | -1.000 (paga) |
| Los López | 0 | 4.000 | -4.000 (paga) |
| Los Fernández | 5.000 | 4.000 | +1.000 (cobra) |
| Los Martínez | 0 | 0 | 0 (no aporta) |

### Por persona (4+2+1+3 = 10 personas elegibles)

```
Cuota por persona = 16.000 / 10 = 1.600
```

| Familia | Personas | Le tocaba | Pagó | Balance |
|---------|----------|-----------|------|---------|
| Los García | 4 | 6.400 | 8.000 | +1.600 |
| Los Rodríguez | 2 | 3.200 | 3.000 | -200 |
| Los López | 1 | 1.600 | 0 | -1.600 |
| Los Fernández | 3 | 4.800 | 5.000 | +200 |
| Los Martínez | 0 | 0 | 0 | 0 |

### Transferencias (by-person)

```
López → García: $1.600
Rodríguez → García: $200 (o → Fernández si el balance coincide)
```
