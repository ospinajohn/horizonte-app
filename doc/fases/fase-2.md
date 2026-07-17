# Fase 2

**Módulos:** Créditos + Tarjetas de Crédito + Activos + Pasivos + Patrimonio + Simulador + Capacidad de Endeudamiento + Fondo de Emergencia + Suscripciones + Reportes

---

## Task 15: Schema Prisma — Fase 2

- **Objetivo:** Extender el schema de Prisma con los modelos de fase 2 sin pérdida de datos de fase 1.
- **Implementación:**
  - Nuevos modelos: `Credit`, `CreditCard`, `CreditCardPurchase`, `Asset`, `Liability`, `Subscription`, `SimulationScenario`
  - `prisma migrate dev` con nombre descriptivo
  - Nuevos IPC handlers y servicios en main process para cada modelo
  - Tipos compartidos actualizados en `src/shared/types.ts`
- **Test:** Migración sobre base con datos de fase 1 sin errores. Datos previos intactos. Prisma Studio muestra todos los modelos.
- **Demo:** Prisma Studio con todos los modelos de fase 1 y 2 coexistiendo con datos reales.

---

## Task 16: Módulo de Créditos

- **Objetivo:** Registrar créditos con tabla de amortización automática y proyección en flujo de caja.
- **Implementación:**
  - Formulario: entidad/banco, valor solicitado, saldo pendiente, tasa EA, cuota mensual, fecha de pago, cuotas totales/pagadas, estado (activo/pagado/en mora)
  - Cálculo de tabla de amortización sistema francés en el servicio del main process
  - Indicadores: cuánto falta, cuotas restantes, interés total pagado/pendiente
  - Cuotas creadas automáticamente en `RecurringItem` para integración con flujo de caja y alertas
- **Test:** Crédito $10M a 36 meses → amortización correcta → cuotas en `RecurringItem` → flujo de caja actualizado.
- **Demo:** Usuario ve su crédito con tabla de amortización completa y las cuotas proyectadas en el flujo de caja.

---

## Task 17: Módulo de Tarjetas de Crédito

- **Objetivo:** Administrar tarjetas con cupo, fechas de corte/pago y compras.
- **Implementación:**
  - Registro de tarjeta: cupo total, fecha de corte, fecha de pago, tasa de interés
  - Compras y avances como `CreditCardPurchase`, con soporte de cuotas
  - Cupo disponible = cupo total − sum(compras del período actual)
  - Alertas automáticas de fecha de corte y pago via `RecurringItem`
  - Gastos con método "crédito" vinculables a una tarjeta específica
- **Test:** Tarjeta $5M → compra $1M → cupo disponible $4M → alerta de pago generada.
- **Demo:** Usuario ve cupo disponible actualizado y fecha de pago próximo resaltada.

---

## Task 18: Activos, Pasivos y Patrimonio Neto

- **Objetivo:** Calcular y visualizar el patrimonio neto con evolución histórica.
- **Implementación:**
  - Registro de activos: nombre, tipo (inmueble, vehículo, tecnología, inversión, otro), valor actual, fecha de adquisición
  - Pasivos calculados automáticamente: saldos de `Credit` + `CreditCard` + `Liability`
  - Patrimonio Neto = sum(Activos) − sum(Pasivos), calculado en tiempo real
  - Snapshot mensual automático guardado en Prisma para historial
  - Gráfica de evolución histórica (area chart Recharts)
  - Widget actualizado en dashboard
- **Test:** Casa $200M + crédito $150M → patrimonio $50M → snapshot guardado → gráfica muestra evolución.
- **Demo:** Usuario ve su patrimonio neto con desglose activos vs pasivos y la gráfica de evolución.

---

## Task 19: Simulador Financiero

- **Objetivo:** Responder "¿qué pasa si...?" recalculando impacto de decisiones sin afectar datos reales.
- **Implementación:**
  - Escenarios disponibles: cambio de salario, nuevo crédito, pago anticipado de deuda, compra importante, venta de activo, aumento/reducción de gastos, desempleo, emergencia médica
  - Cada escenario clona el estado financiero en memoria (sin escritura en Prisma) y aplica la variación
  - Vista comparativa: situación actual vs simulada (métricas lado a lado)
  - Métricas recalculadas: flujo de caja, capacidad de ahorro, fecha de metas, endeudamiento, liquidez
  - Escenarios guardables como `SimulationScenario` en Prisma para comparación posterior
- **Test:** Simular nuevo crédito → métricas simuladas correctas → datos reales en Prisma sin modificar.
- **Demo:** Usuario simula un nuevo crédito y ve el impacto en flujo de caja y metas, lado a lado con la situación actual.

---

## Task 20: Capacidad de Endeudamiento

- **Objetivo:** Calcular en tiempo real cuánto puede endeudarse el usuario.
- **Implementación:**
  - % comprometido = (sum cuotas mensuales activas / ingreso mensual promedio) × 100
  - Semáforo: Verde < 30%, Amarillo 30–40%, Rojo > 40%
  - Calculadora interactiva: ingresar cuota hipotética y ver viabilidad inmediata
  - Cuota máxima recomendada = (30% del ingreso) − cuotas actuales
  - Integrado con el simulador de "nuevo crédito" (Task 19)
  - Widget en dashboard
- **Test:** Ingresos $3M, cuotas $600K (20%) → agregar cuota $400K → total 33% → semáforo amarillo.
- **Demo:** Usuario ingresa la cuota de un crédito que le ofrecieron y ve instantáneamente si puede asumirlo.

---

## Task 21: Fondo de Emergencia

- **Objetivo:** Calcular meses cubiertos y recomendar aportes para llegar a la meta.
- **Implementación:**
  - Gasto mensual promedio = promedio de gastos de últimos 3 meses (query Prisma agregado)
  - Meses cubiertos = saldo de cuentas designadas / gasto mensual promedio
  - Meta configurable (default: 6 meses) guardada en `AppConfig`
  - Progress ring visual con meses cubiertos
  - Recomendación de aporte mensual para llegar a la meta en el tiempo deseado
  - El usuario puede designar qué cuentas forman parte del fondo (campo `isEmergencyFund` en modelo `Account`)
- **Test:** Gastos promedio $2M → cuenta ahorro $5M → 2.5 meses cubiertos → recomendación de aporte correcta.
- **Demo:** "Tu fondo cubre 2.5 meses — necesitas ahorrar $X/mes para llegar a 6 meses."

---

## Task 22: Módulo de Suscripciones

- **Objetivo:** Administrar suscripciones recurrentes y su impacto en el presupuesto.
- **Implementación:**
  - Registro: nombre, valor mensual, fecha de cobro, categoría, cuenta de débito, activa/inactiva
  - Suscripciones predefinidas como seed: Netflix, Spotify, ChatGPT, Amazon Prime, Disney+, Microsoft 365, Google One
  - Costo total mensual y anual calculado con Prisma aggregate
  - Detección de aumentos: si cobro real difiere del registrado → alerta de cambio de precio
  - Integración con `RecurringItem` para cobros automáticos y recordatorios
  - Widget en dashboard con costo mensual total
- **Test:** 4 suscripciones → totales correctos → cambio de precio detectado → alerta generada.
- **Demo:** Usuario ve el total mensual y anual de todas sus suscripciones y el impacto en su presupuesto.

---

## Task 23: Reportes y Exportación

- **Objetivo:** Generar reportes financieros exportables en PDF, Excel y CSV.
- **Implementación:**
  - Reporte mensual: resumen de ingresos, gastos por categoría, ahorro, presupuesto vs real
  - Reporte anual: evolución mes a mes, tendencias, patrimonio
  - Reportes específicos: gastos por categoría, ingresos, metas, ahorros
  - Exportación PDF: jsPDF + html2canvas (renderiza el componente React del reporte)
  - Exportación Excel/CSV: SheetJS con datos de Prisma queries
  - Selector de rango de fechas para cada reporte
  - Guardado en carpeta `Documents/Horizonte/` via Electron `dialog.showSaveDialog`
- **Test:** Reporte mensual → PDF generado correctamente → Excel con datos correctos → CSV importable.
- **Demo:** Usuario genera el reporte del mes en PDF y lo guarda en su computador con un clic.
