# Fase 1 — MVP

**Módulos:** Gestión Financiera base + Dashboard + Planificador + Presupuestos + Metas + Alertas de pago

---

## Task 1: Scaffolding del proyecto y configuración base

- **Objetivo:** Crear el proyecto Electron + Vite + React + TypeScript en `horizonte-app` con toda la configuración base lista para desarrollar.
- **Implementación:**
  - Inicializar con `electron-vite` (template React + TypeScript)
  - Configurar Tailwind CSS y Shadcn/ui con tema financiero oscuro profesional
  - Configurar `electron-builder` para Windows con soporte para binarios nativos de Prisma (`binaryTargets = ["native", "windows"]`)
  - Configurar `tsconfig` con paths absolutos (`@/components`, `@/lib`, etc.)
  - Estructura de carpetas: `src/renderer`, `src/main`, `src/preload`, `src/shared`, `prisma/`
- **Test:** La app abre una ventana Electron sin errores con el tema aplicado.
- **Demo:** Ventana corriendo en Windows con layout base y tema oscuro profesional.

---

## Task 2: Base de datos — Prisma schema y migraciones

- **Objetivo:** Definir el schema completo de Prisma para el MVP y verificar acceso desde el main process.
- **Implementación:**
  - Instalar `prisma` + `@prisma/client`, configurar `datasource` SQLite apuntando a `userData/horizonte.db`
  - Modelos: `Account`, `Transaction`, `Category`, `Transfer`, `Budget`, `BudgetCategory`, `SavingsGoal`, `SavingsContribution`, `RecurringItem`, `AppConfig`
  - `binaryTargets = ["native", "windows"]` en schema
  - Script de inicialización en main: corre `prisma migrate deploy` al arrancar
  - Seed con datos de ejemplo para desarrollo
- **Test:** Base de datos creada en `userData/`, tablas existentes, seed sin errores, queries funcionando.
- **Demo:** Prisma Studio mostrando modelos con datos de ejemplo.

---

## Task 3: IPC Bridge y capa de servicios

- **Objetivo:** Puente de comunicación renderer ↔ main process con servicios Prisma.
- **Implementación:**
  - `preload.ts` con `contextBridge` exponiendo métodos tipados
  - Servicios en main: `AccountService`, `TransactionService`, `CategoryService`, `TransferService`
  - Tipos compartidos en `src/shared/types.ts` derivados de Prisma
  - Hooks React custom: `useAccounts`, `useTransactions`, etc.
  - Zustand store con slices por dominio
- **Test:** `window.api.accounts.getAll()` retorna datos del seed con tipos correctos e IntelliSense funcionando.
- **Demo:** Console.log en renderer con datos reales de SQLite via IPC.

---

## Task 4: Módulo de Cuentas (CRUD completo)

- **Objetivo:** Crear, editar y eliminar cuentas financieras de todos los tipos.
- **Implementación:**
  - Listado con tarjetas por tipo (Banco, Efectivo, Nequi, Daviplata, Tarjetas, Ahorros, Inversiones)
  - Formulario React Hook Form + Zod (nombre, tipo, saldo inicial, color, icono)
  - Confirmación de eliminación con advertencia si tiene transacciones (`_count` Prisma)
  - Saldo actual = saldo inicial + sum(transacciones)
  - Total consolidado de todas las cuentas
- **Test:** CRUD completo funciona. Saldo total se recalcula tras cada operación.
- **Demo:** Usuario crea tres cuentas con saldos distintos y ve el total consolidado.

---

## Task 5: Módulo de Ingresos

- **Objetivo:** Registrar ingresos con soporte para repetición automática.
- **Implementación:**
  - Formulario: fecha, valor, categoría, cuenta destino, descripción, tipo de repetición (única/diaria/semanal/quincenal/mensual/anual)
  - Ingresos recurrentes generan instancias en `RecurringItem`
  - Actualización de saldo via Prisma `$transaction` (atómica)
  - Listado con filtros por fecha, categoría y cuenta
- **Test:** Salario mensual registrado → saldo aumenta → instancia en `RecurringItem` → aparece en listado.
- **Demo:** Usuario registra salario de $3.000.000 y ve el saldo actualizarse al instante.

---

## Task 6: Módulo de Gastos

- **Objetivo:** Registrar gastos con categorías, método de pago, etiquetas y comprobante fotográfico.
- **Implementación:**
  - Formulario: fecha, valor, categoría, cuenta, método de pago, descripción, etiquetas (JSON), foto (guardada en `userData/receipts/`)
  - Listado con filtros avanzados (fecha, categoría, cuenta, etiquetas, rango de valor)
  - Actualización de saldo atómica via Prisma `$transaction`
  - Todas las categorías predefinidas: Vivienda, Alimentación, Transporte, Salud, Educación, Tecnología, Entretenimiento, Mascotas, Impuestos, Viajes, Compras, Otros
- **Test:** Gasto registrado → saldo baja → comprobante guardado → filtros funcionan.
- **Demo:** Usuario registra gasto con foto y lo encuentra por etiqueta.

---

## Task 7: Módulo de Transferencias

- **Objetivo:** Mover dinero entre cuentas con consistencia total en saldos.
- **Implementación:**
  - Formulario: cuenta origen, destino, valor, fecha, descripción
  - Validación de saldo suficiente en cuenta origen
  - Prisma `$transaction`: dos `Transaction` vinculadas atómicas (TRANSFER_OUT + TRANSFER_IN)
  - Historial de transferencias
- **Test:** Transferir $500K → ambas cuentas actualizadas atómicamente → historial correcto.
- **Demo:** Usuario mueve dinero y ve saldos actualizarse en tiempo real.

---

## Task 8: Layout principal y navegación

- **Objetivo:** Shell de la app con sidebar, rutas y experiencia fluida.
- **Implementación:**
  - Sidebar con iconos Lucide y labels para todos los módulos
  - Barra superior con nombre de la app, fecha actual y saldo total
  - React Router para navegación entre módulos
  - Frame Electron personalizado (sin barra nativa de Windows, botones custom con `-webkit-app-region`)
  - Transiciones suaves, módulo activo resaltado en sidebar
- **Test:** Navegación completa sin errores. Botones de ventana funcionan. Módulo activo resaltado.
- **Demo:** App profesional sin chrome nativa de Windows, navegable por todos los módulos.

---

## Task 9: Dashboard principal

- **Objetivo:** Pantalla de inicio que responde preguntas financieras clave en < 10 segundos.
- **Implementación:**
  - Widget: Dinero disponible total
  - Widget: Ingresos del mes vs mes anterior (con delta %)
  - Widget: Gastos del mes vs mes anterior (con delta %)
  - Widget: Próximos pagos (7 días desde `RecurringItem`)
  - Widget: Balance del mes (ingresos − gastos)
  - Widget: Top 3 metas de ahorro con progreso
  - Widget: Donut gastos por categoría del mes (Recharts)
  - Widget: Line chart flujo de caja 30 días (Recharts)
  - Todos los datos cargados en paralelo con `Promise.all`
- **Test:** Carga < 2s. Valores correctos. Widgets se actualizan al registrar transacciones.
- **Demo:** Usuario abre la app y ve su situación financiera completa del mes en la pantalla inicial.

---

## Task 10: Módulo de Presupuestos

- **Objetivo:** Límites de gasto por categoría con seguimiento en tiempo real.
- **Implementación:**
  - Crear presupuesto por mes, quincena o semana con límites por categoría
  - Cálculo en tiempo real: utilizado (sum gastos en categoría en el período), restante, porcentaje
  - Barras de progreso con semáforo (verde < 70%, amarillo 70–90%, rojo ≥ 90%)
  - Proyección de cierre: (gasto acumulado / días transcurridos) × días totales del período
  - Alerta automática al superar 80%
- **Test:** Presupuesto $500K → gasto $400K → 80% → alerta generada → proyección correcta.
- **Demo:** Usuario ve consumo de presupuesto por categoría con proyección en tiempo real.

---

## Task 11: Módulo de Metas de Ahorro

- **Objetivo:** Crear y hacer seguimiento de objetivos de ahorro específicos.
- **Implementación:**
  - Formulario: nombre, valor objetivo, fecha límite, prioridad (alta/media/baja), cuenta destino, ahorro automático mensual
  - Aportes manuales como `SavingsContribution` via Prisma
  - Indicadores: % completado, valor faltante, tiempo restante, ahorro mensual recomendado, fecha estimada de cumplimiento
  - Tarjetas visuales con barra de progreso y cuenta regresiva
  - Ejemplos predefinidos: Casa, Viaje, Fondo emergencia, Moto, Computador, Universidad
- **Test:** Meta $3M → aporte $500K → indicadores recalculados → fecha estimada actualizada.
- **Demo:** Usuario ve sus metas con progreso y cuánto debe ahorrar mensualmente.

---

## Task 12: Planificador — Flujo de Caja y Calendario Financiero

- **Objetivo:** Visualizar cómo evolucionará el dinero del usuario.
- **Implementación:**
  - Motor de proyección: saldo actual + todos los `RecurringItem` futuros hasta 12 meses
  - Vistas: próxima quincena, próximo mes, 3 meses, 6 meses, 1 año
  - Area chart (Recharts) con zona positiva verde y negativa roja
  - Calendario mensual con eventos financieros marcados por día
  - Tabla de eventos ordenada por fecha con impacto en saldo
- **Test:** Salario + arriendo en `RecurringItem` → proyección correcta → calendario con días correctos.
- **Demo:** Usuario ve saldo proyectado 3 meses y todos los eventos en el calendario.

---

## Task 13: Alertas inteligentes del MVP

- **Objetivo:** Notificaciones proactivas para pagos próximos y situaciones críticas.
- **Implementación:**
  - Motor de alertas en main process, ejecutado al iniciar la app y cada hora
  - Notificación nativa Windows 3 días y 1 día antes de vencimientos en `RecurringItem`
  - Alerta cuando presupuesto supera 80% y 100%
  - Alerta cuando saldo proyectado cae a negativo en los próximos 7 días
  - Centro de alertas en app: listado con estado leída/no leída, persistido en Prisma
  - Badge en sidebar con contador no leídas
- **Test:** Pago en 2 días → notificación nativa → alerta en centro → marcar leída → badge actualizado.
- **Demo:** Notificación nativa Windows recordando pago próximo, visible en el centro de alertas.

---

## Task 14: Onboarding del usuario

- **Objetivo:** Guiar al usuario en la configuración inicial la primera vez que abre la app.
- **Implementación:**
  - Detectar primera apertura via `AppConfig.onboardingCompleted` en Prisma
  - Pasos: 1) Bienvenida + nombre, 2) Moneda + día de pago, 3) Primera cuenta, 4) Ingreso principal, 5) Tour del dashboard
  - Opción de saltar en cualquier paso
  - Al completar: `AppConfig.onboardingCompleted = true`
- **Test:** Primera apertura → onboarding → completar → dashboard con datos → segunda apertura → no reaparece.
- **Demo:** Usuario nuevo configurado en 2 minutos, listo para usar la app.
