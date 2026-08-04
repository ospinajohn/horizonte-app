# Fase: Vista Mensual/Quincenal del flujo de caja

## Objetivo

Permitir al usuario ver y planear su dinero agrupado por **quincena** (Q1: día 1-15, Q2: día 16-fin de mes), además de la vista mensual actual, para responder: "¿cuánto voy a gastar en cada quincena y con qué ingreso lo cubro?"

Basado en un flujo manual que el usuario llevaba antes en Notion (ver conversación), simplificado para evitar sus fallas: campo de quincena manual (desincronización), compromisos duplicados al partirlos en dos filas, y falta de vínculo entre gasto e ingreso de la misma quincena.

## Decisiones de diseño

1. **La quincena no se guarda, se calcula.** Se deriva de la fecha (`date` de `Transaction`, `nextDate` de `RecurringItem`) con una función pura `getQuincena(date): 'Q1' | 'Q2'`. Día 1-15 → Q1, 16-fin → Q2. Sin campo nuevo en la base de datos para transacciones/compromisos individuales.

2. **El sueldo se registra igual que hoy**, sin cambios de modelo:
   - Pago quincenal real → 2 `Transaction` tipo `INCOME` (o `RecurringItem` con `recurrence: BIWEEKLY`), una fecha en cada quincena. La quincena se infiere sola.
   - Pago mensual único → 1 `Transaction`/`RecurringItem` INCOME al mes. Toda la quincena donde no cae el pago debe mostrar $0 de ingreso propio, no inventar un reparto.

3. **Compromisos (`RecurringItem`) siguen siendo un registro por pago.** Partir un compromiso en dos pagos (ej. arriendo en dos partes) es una acción explícita del usuario creando dos `RecurringItem` distintos — no es el comportamiento por defecto ni requiere un campo especial de "vinculación".

4. **Preferencia global, no reemplazo de vista.** En Ajustes: `financialViewDefault: 'MONTHLY' | 'BIWEEKLY'`. Determina qué pestaña abre primero en el Dashboard. Ambas vistas (Mes | Quincena) están siempre disponibles como pestañas — la configuración nunca oculta una de las dos.

5. **Corte de fecha estricto**, sin rango de tolerancia: día ≤ 15 = Q1, día ≥ 16 = Q2. Si un compromiso tiene fecha ambigua (rango, ej. "13 → 19"), se usa la fecha de registro (`nextDate`/`date`) tal cual está guardada; el usuario ajusta la fecha si quiere reclasificarlo.

6. **Transferencias (`Transfer`) no cuentan** como gasto/ingreso de quincena — son movimiento interno entre cuentas propias.

## Qué muestra el Dashboard (vista Quincena)

Para la quincena seleccionada (actual por defecto, con selector para navegar mes/quincena):

| Métrica | Fuente |
|---|---|
| Ingreso de la quincena | Suma `Transaction` INCOME con fecha en el rango |
| Comprometido (gasto fijo) | Suma `RecurringItem` activos con `nextDate` en el rango |
| Gastado real | Suma `Transaction` EXPENSE con fecha en el rango |
| Saldo proyectado | Ingreso − Comprometido − Gastado variable |
| Disponible libre | Saldo proyectado, resaltado como "para gastar sin comprometer lo fijo" |

Además, un resumen comparativo Q1 vs Q2 del mes en curso (dos columnas o barras), mostrando ingreso vs gasto de cada una lado a lado.

## Tareas

### 1. Utilidades base
- [ ] Agregar `getQuincena(date: Date): 'Q1' | 'Q2'` en `src/renderer/src/lib/utils.ts`
- [ ] Agregar `getQuincenaRange(date: Date, quincena: 'Q1' | 'Q2'): { start: Date; end: Date }` para obtener el rango de fechas de una quincena dada
- [ ] Tests unitarios de estos helpers (casos borde: meses de 28/29/30/31 días)

### 2. Configuración (Ajustes)
- [ ] Agregar campo `financialViewDefault: 'MONTHLY' | 'BIWEEKLY'` al modelo de settings/preferencias (revisar dónde vive la config actual del usuario)
- [ ] UI en pantalla de Ajustes: selector "Mensual" / "Quincenal" con explicación corta
- [ ] Persistir y leer la preferencia al cargar el Dashboard

### 3. Cálculo de datos por quincena (capa de datos/handlers)
- [ ] Función/handler que agregue `Transaction` (INCOME/EXPENSE) por rango de fechas de quincena
- [ ] Función/handler que agregue `RecurringItem` activos cuyo `nextDate` cae en el rango de la quincena
- [ ] Excluir `Transfer` del cálculo
- [ ] Exponer estos cálculos vía IPC igual que el resto de queries del Dashboard (revisar patrón existente en `src/main`)

### 4. UI del Dashboard
- [ ] Agregar pestañas "Mes | Quincena" en el Dashboard (la pestaña activa por defecto según `financialViewDefault`)
- [ ] Construir tarjetas de resumen quincenal (Ingreso, Comprometido, Gastado, Disponible) reutilizando componentes de tarjetas/stat existentes
- [ ] Selector de navegación entre quincenas (anterior/actual/siguiente, o por mes+Q1/Q2)
- [ ] Vista comparativa Q1 vs Q2 del mes en curso

### 5. Validación manual
- [ ] Probar con pago quincenal real (2 ingresos/mes) — verificar que cada quincena muestra su ingreso correcto
- [ ] Probar con pago mensual único — verificar que la quincena sin ingreso muestra $0 y no rompe el cálculo de disponible
- [ ] Probar compromiso partido manualmente en dos `RecurringItem` (ej. arriendo) — verificar que cada parte cae en su quincena
- [ ] Cambiar la preferencia Mensual↔Quincenal en Ajustes y verificar que el Dashboard respeta el default sin perder acceso a la otra pestaña

## Fuera de alcance (explícitamente no se hace en esta fase)

- No se agrega campo de quincena manual a `Transaction` ni `RecurringItem`.
- No se automatiza la división de un compromiso en partes (el usuario lo hace manualmente creando dos items).
- No se soportan cortes de quincena distintos a 1-15/16-fin (ej. quincenas por fecha de pago custom).
