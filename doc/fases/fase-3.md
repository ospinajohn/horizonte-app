# Fase 3

**Módulos:** Salud Financiera + Analítica Avanzada + Alertas Inteligentes + Recomendaciones + Centro de Decisiones + Configuración completa

---

## Task 24: Motor de reglas y schema Fase 3

- **Objetivo:** Crear el motor de reglas financieras y extender el schema para la fase 3.
- **Implementación:**
  - Nuevos modelos Prisma: `HealthSnapshot`, `RecommendationLog`, `DecisionQuery`
  - Motor de reglas en main process: array de `Rule` objects con estructura `{ id, condition: (state) => boolean, message: string, severity: 'critical' | 'warning' | 'info', action: string }` evaluados contra el estado financiero completo
  - Método `getFinancialState()` que construye el estado completo del usuario con un conjunto de queries Prisma paralelas
  - Las reglas producen alertas y recomendaciones tipadas
  - Motor ejecutable de forma aislada para testing
- **Test:** Motor de reglas con datos de prueba conocidos produce exactamente las alertas y recomendaciones esperadas.
- **Demo:** Ejecutar el motor en desarrollo y ver output de alertas/recomendaciones en consola.

---

## Task 25: Salud Financiera — Índice 0 a 100

- **Objetivo:** Score compuesto que resume la situación financiera del usuario en un número accionable.
- **Implementación:**
  - 8 factores con pesos definidos:
    - Liquidez (15%)
    - Ahorro (20%)
    - Endeudamiento (20%)
    - Patrimonio (10%)
    - Cumplimiento de presupuesto (15%)
    - Fondo de emergencia (10%)
    - Tendencia financiera (5%)
    - Diversificación (5%)
  - Cada factor produce un sub-score de 0 a 100 con función de cálculo pura y testeable
  - Score final ponderado
  - Gauge animado con rangos de color: 0–40 rojo, 40–70 amarillo, 70–100 verde
  - Desglose por factor con explicación textual de cada uno
  - Snapshot mensual automático guardado en `HealthSnapshot` via Prisma
  - Top 3 recomendaciones generadas para los factores con menor puntaje
- **Test:** Datos conocidos (endeudamiento 45%, ahorro 0%, fondo 1 mes) → score calculado correctamente → recomendaciones relevantes → snapshot guardado.
- **Demo:** Usuario ve su score (ej: 62/100) con desglose por factor y las 3 acciones concretas para mejorarlo.

---

## Task 26: Analítica avanzada

- **Objetivo:** Gráficas y comparaciones para entender tendencias y patrones financieros.
- **Implementación:**
  - Gastos por categoría: donut chart + tabla detallada, filtrable por mes/trimestre/año
  - Ingresos vs Gastos: bar chart mensual comparativo
  - Evolución del ahorro: line chart histórico
  - Evolución del patrimonio: area chart histórico
  - Endeudamiento histórico: gauge + line chart
  - Flujo de caja: area chart con zonas positivas (verde) y negativas (roja)
  - Comparaciones automáticas: vs mes anterior, vs año anterior, vs promedio 6 meses
  - Sección "Insights": top 3 datos más relevantes del período generados por el motor de reglas
- **Test:** Con 6 meses de datos → todas las gráficas renderizan correctamente → comparaciones muestran deltas correctos → insights relevantes.
- **Demo:** Usuario navega por la analítica y ve que este mes gastó 20% más en restaurantes vs el mes anterior.

---

## Task 27: Alertas inteligentes avanzadas

- **Objetivo:** Alertas proactivas basadas en patrones de comportamiento y proyecciones.
- **Implementación:**
  - Todas las alertas del motor de reglas (Task 24) integradas en la UI
  - Nuevas alertas:
    - Gasto inusual en categoría (>20% vs promedio de los últimos 3 meses)
    - Saldo negativo proyectado en los próximos 7 días
    - Deuda total > 40% de ingresos mensuales
    - Fondo de emergencia < 2 meses
    - Suscripción con aumento de precio detectado
  - Priorización: críticas (rojo) → advertencias (amarillo) → informativas (azul)
  - Centro de alertas mejorado con agrupación por tipo y acciones rápidas ("Ver presupuesto", "Ver créditos", "Ver analítica")
  - Notificaciones nativas de Windows para alertas críticas
- **Test:** Cada tipo de alerta se dispara con las condiciones correctas. Acciones rápidas navegan al módulo correcto.
- **Demo:** Usuario ve alerta "Este mes gastaste 35% más en restaurantes" con botón directo a la analítica de esa categoría.

---

## Task 28: Recomendaciones Inteligentes

- **Objetivo:** El sistema sugiere acciones concretas personalizadas basadas en el estado financiero real.
- **Implementación:**
  - Recomendaciones generadas por el motor de reglas, guardadas en `RecommendationLog` via Prisma
  - Tipos de recomendaciones:
    - Ahorro posible: "Puedes ahorrar $X reduciendo gastos en Y categoría"
    - Optimización de deuda: pagar primero el crédito con mayor tasa de interés
    - Adelanto de cuotas: cuando hay liquidez suficiente sin afectar metas
    - Timing de compras: "Es mejor esperar N meses antes de comprar X"
    - Oportunidad de inversión: cuando el ahorro supera 3 meses de gastos
  - Cada recomendación incluye: descripción, impacto estimado en $ o %, categoría, acción sugerida con deep link al módulo
  - Panel de recomendaciones con historial (leídas/no leídas/aplicadas)
- **Test:** Con estado financiero conocido → recomendaciones correctas generadas → guardadas en `RecommendationLog` → marcables como aplicadas.
- **Demo:** Usuario ve "Conviene pagar primero el crédito del banco X — ahorrarías $240K en intereses" con botón directo al módulo de créditos.

---

## Task 29: Centro de Decisiones + Configuración completa

- **Objetivo:** Interfaz conversacional para responder preguntas financieras específicas + configuración completa de la app.

### Centro de Decisiones
- **Implementación:**
  - Preguntas predefinidas con respuestas calculadas en tiempo real:
    - ¿Puedo comprar un carro? / ¿Puedo comprar un computador?
    - ¿Cuánto puedo gastar hoy?
    - ¿Cuánto me quedará la próxima quincena?
    - ¿Cuánto puedo ahorrar este mes?
    - ¿Cuándo podré comprar una casa?
    - ¿Qué pasa si renuncio?
    - ¿Qué pasa si aumento mis ingresos en X%?
    - ¿Qué pasa si reduzco mis gastos en X%?
  - Cada pregunta llama al motor de reglas con el contexto correspondiente
  - Respuestas con explicación detallada + números concretos + recomendación de acción
  - Historial de consultas guardado en `DecisionQuery` via Prisma
  - Input libre de texto para preguntas personalizadas (respuesta basada en reglas disponibles)

### Configuración completa
- **Implementación:**
  - Moneda (COP por defecto, otras disponibles)
  - Idioma (Español por defecto)
  - Tema: claro / oscuro / sistema
  - Día de inicio de semana
  - Día de pago (quincena o mensual)
  - Día de corte de tarjetas (default)
  - Notificaciones: activar/desactivar por tipo, anticipación de alertas (1/3/7 días)
  - Toda la configuración persistida en `AppConfig` via Prisma

- **Test:** Preguntas predefinidas retornan respuestas correctas con los datos actuales. Cambios de configuración persisten y se aplican inmediatamente.
- **Demo:** Usuario pregunta "¿Puedo comprar un computador de $3.000.000?" y recibe respuesta: "Sí, puedes. Tu liquidez actual permite esta compra. Quedarías con $X disponibles y tus metas no se verían afectadas."
