# Fase: Enriquecer la pestaña Quincena del Dashboard

## Contexto

La pestaña Mes tiene 4 filas de contenido (Liquidez+Flujo, Gráfico+Salud+Log, Metas+Insights, Tarjetas), mientras que Quincena (`BiweeklyView.tsx`) solo tiene 2 (Hero+Nav, Comparativa). Esta fase agrega el nivel de "inteligencia" que le falta, reutilizando datos que ya se calculan en `DashboardService.getBiweeklyData` cuando sea posible.

Ver fase base: [FASE-vista-quincenal.md](FASE-vista-quincenal.md)

## Propuestas y orden de implementación (de más fácil a más compleja)

### 1. Lista de compromisos de la quincena (reemplaza el `NavCard` vacío)
El `DashboardService.getBiweeklyData` ya consulta `RecurringItem` activos en el rango para calcular "Comprometido", pero descarta el detalle. Se expone la lista y se muestra en el espacio vacío junto al hero, con el mismo patrón visual de `CashflowCard` (ícono, nombre, fecha, monto).

### 2. Top categoría de gasto de la quincena
Reutiliza `TransactionService.getExpensesByCategory` (ya existe, recibe rango de fechas) con el rango de la quincena activa en vez del mes. Se muestra como tarjeta pequeña similar a la de `InsightsRow`.

### 3. Tendencia vs quincena anterior
Se llama `getBiweeklyData` para la quincena inmediatamente anterior (ya se puede derivar con la misma lógica de navegación que usa `goToPrevQuincena`) y se compara el disponible/gasto contra el actual. Se muestra como badge de crecimiento, igual al que ya usa `LiquidityCard` (+X% vs mes anterior).

### 4. Gráfico histórico Q1 vs Q2 (últimas 4-6 quincenas)
Requiere iterar `getBiweeklyData` sobre varios períodos consecutivos (similar a como `DashboardPage` ya arma `monthlyComparison` iterando 6 meses) y graficarlo con el mismo componente/librería que usa `IncomeVsExpenseChart`.

### 5. Salud de la quincena (mini gauge)
Indicador de "% de la quincena transcurrida" vs "% del ingreso ya comprometido+gastado", para alertar a mitad de quincena si el ritmo de gasto es insostenible. Es el más complejo porque mezcla dos ejes (tiempo y dinero) y requiere diseño de gauge nuevo (o adaptar `HealthGauge`).

## Tareas

### Backend (DashboardService / preload)
- [ ] `getBiweeklyData`: incluir en la respuesta la lista `committedItems: RecurringItem[]` usada para el cálculo de "Comprometido" (ya se consulta, solo falta devolverla)
- [ ] Nuevo método o parámetro en `TransactionService.getExpensesByCategory` (ya acepta rango) — solo verificar que funcione igual con rango quincenal, sin cambios de firma
- [ ] Confirmar que `getBiweeklyData` se puede llamar para cualquier año/mes/quincena pasado (ya lo soporta) para poder pedir la quincena anterior y el histórico de 4-6 períodos

### Frontend — Tarea 1: Lista de compromisos
- [ ] Reemplazar el `NavCard` actual (o agregar debajo) con una lista de compromisos de la quincena activa, estilo `CashflowCard`
- [ ] Mantener los botones de navegación prev/next quincena visibles

### Frontend — Tarea 2: Top categoría
- [ ] Llamar `window.api.transactions.getExpensesByCategory(rangeStart, rangeEnd)` de la quincena activa
- [ ] Tarjeta pequeña con nombre de categoría + monto + color, estilo `InsightsRow`

### Frontend — Tarea 3: Tendencia vs quincena anterior
- [ ] Calcular rango de la quincena anterior a partir de la actual
- [ ] Pedir `getBiweeklyData` de esa quincena y calcular variación % de disponible o gasto
- [ ] Badge de crecimiento en el `HeroCard`, mismo patrón que `LiquidityCard`

### Frontend — Tarea 4: Gráfico histórico Q1 vs Q2
- [ ] Iterar las últimas 4-6 quincenas (usando la lógica de `getQuincenaRange` + navegación) y pedir sus datos en paralelo
- [ ] Graficar con el mismo componente/librería de `IncomeVsExpenseChart`, adaptando labels a "Jul Q1", "Jul Q2", etc.

### Frontend — Tarea 5: Mini gauge de salud de la quincena
- [ ] Calcular % de días transcurridos de la quincena (hoy vs rango)
- [ ] Calcular % de (comprometido+gastado) sobre ingreso
- [ ] Diseñar gauge o barra comparativa mostrando ambos ejes, con alerta visual si el gasto va más rápido que el tiempo

### Validación manual
- [ ] Probar cada tarjeta nueva con datos reales, navegando entre quincenas y meses
- [ ] Confirmar que todo sigue el lenguaje visual ya corregido (glow, bordes white/5, Plus Jakarta Sans, iconos en badge redondeado)
