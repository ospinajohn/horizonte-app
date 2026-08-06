<div align="center">

# Horizonte

**Asistente financiero personal de escritorio para Windows**

No es un simple registrador de gastos: es un copiloto financiero que responde preguntas como
*¿cuánto dinero tengo disponible ahora mismo?*, *¿qué pasará con mis finanzas la próxima quincena?*
o *¿puedo asumir esta deuda?*

[![Release](https://img.shields.io/github/v/release/ospinajohn/horizonte-app?label=release&color=10b981&style=flat-square)](https://github.com/ospinajohn/horizonte-app/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/ospinajohn/horizonte-app/total?color=0ea5e9&style=flat-square)](https://github.com/ospinajohn/horizonte-app/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-0ea5e9?style=flat-square)](#-descarga-e-instalación)
[![Electron](https://img.shields.io/badge/Electron-33-4f5b93?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Descargar última versión](https://github.com/ospinajohn/horizonte-app/releases/latest) ·
[Ver todos los releases](https://github.com/ospinajohn/horizonte-app/releases) ·
[Reportar un problema](https://github.com/ospinajohn/horizonte-app/issues)

</div>

---

## Contenido

- [Descripción](#descripción)
- [Módulos y funcionalidades](#módulos-y-funcionalidades)
- [Descarga e instalación](#-descarga-e-instalación)
- [Actualizaciones automáticas](#-actualizaciones-automáticas)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Desarrollo local](#desarrollo-local)
- [Publicar una nueva versión](#publicar-una-nueva-versión)
- [Base de datos](#base-de-datos)
- [Licencia](#licencia)

---

## Descripción

**Horizonte** centraliza toda la información financiera personal del usuario —cuentas, movimientos,
tarjetas de crédito, créditos, presupuestos, metas de ahorro, patrimonio— y entrega proyecciones,
simulaciones y recomendaciones inteligentes sobre ella. Corre 100% local: la base de datos vive en el
equipo del usuario (SQLite), no hay backend ni servidor remoto.

## Módulos y funcionalidades

| Módulo | Qué hace |
|---|---|
| **Dashboard** | Liquidez disponible, salud financiera, proyección a la próxima quincena, decisiones sugeridas |
| **Cuentas** | Bancos, efectivo, Nequi/Daviplata, ahorros e inversión, con saldo consolidado |
| **Transacciones** | Ingresos, gastos y categorización, con resumen mensual y por categoría |
| **Transferencias** | Movimiento de fondos entre cuentas propias |
| **Compromisos recurrentes** | Pagos e ingresos periódicos (nómina, arriendo, servicios, suscripciones) con proyección y marcado de pago |
| **Presupuestos** | Límites por categoría y período (mensual, quincenal, semanal) con seguimiento de gasto real |
| **Metas de ahorro** | Objetivos con progreso, aportes individuales y fecha límite |
| **Tarjetas de crédito** | Cupo, uso, fechas de corte/pago, compras a cuotas, inteligencia de mejor momento de compra y comparador entre tarjetas |
| **Créditos** | Tabla de amortización, saldo pendiente e intereses |
| **Patrimonio** | Activos y pasivos, snapshots históricos de patrimonio neto |
| **Laboratorio financiero** | Simulador de escenarios y capacidad de endeudamiento |
| **Alertas** | Motor que corre al iniciar y cada hora: pagos próximos, presupuestos excedidos, etc. |
| **Reportes** | Exportación a PDF/Excel de la información financiera |
| **Centro de decisión** | Preguntas en lenguaje natural sobre las finanzas del usuario |

## 📥 Descarga e instalación

1. Ve a la sección de [**Releases**](https://github.com/ospinajohn/horizonte-app/releases/latest).
2. Descarga el instalador `Horizonte-<versión>-setup.exe` del release marcado como **Latest**.
3. Ejecuta el instalador — crea acceso directo en el escritorio automáticamente.

> Horizonte guarda toda tu información localmente en tu equipo (`%APPDATA%/Horizonte`). Nada se envía a
> ningún servidor externo.

## 🔄 Actualizaciones automáticas

La app revisa si hay una versión nueva publicada en GitHub Releases al iniciar y cada 4 horas:

1. Si hay una versión nueva, aparece un aviso discreto en la esquina inferior derecha con el número de
   versión y un botón **Descargar**.
2. Al descargar, se muestra el progreso en la misma tarjeta.
3. Cuando termina de descargar, el botón cambia a **Reiniciar y actualizar** — al pulsarlo, la app se
   cierra, instala la nueva versión y vuelve a abrir sola.

No hace falta volver a descargar el instalador manualmente en cada versión: basta con aceptar la
actualización cuando se lo pida. Esto se implementa con [`electron-updater`](https://www.electron.build/auto-update)
contra los assets publicados en los Releases de este repositorio.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Shell de escritorio | Electron 33 |
| Build tool | electron-vite |
| Frontend | React 18 + TypeScript |
| UI | Tailwind CSS + Radix UI |
| Gráficas | Recharts |
| ORM / base de datos | Prisma + SQLite |
| Estado global | Zustand |
| Formularios | React Hook Form + Zod |
| Empaquetado y auto-update | electron-builder + electron-updater |

## Arquitectura

```
Electron Main Process (Node.js)
  └── src/main/
        ├── index.ts              ← entrada principal, crea BrowserWindow
        ├── database/client.ts    ← singleton Prisma (ruta dinámica dev/prod)
        ├── ipc/handlers.ts       ← registra todos los ipcMain.handle()
        └── services/             ← lógica de negocio con Prisma Client

Preload Script (bridge seguro, contextIsolation)
  └── src/preload/index.ts        ← contextBridge → window.api.*

Renderer Process (React)
  └── src/renderer/src/
        ├── App.tsx               ← router principal
        ├── components/           ← UI por módulo
        ├── hooks/                ← hooks IPC
        ├── store/                ← Zustand
        └── lib/utils.ts

Shared
  └── src/shared/types.ts         ← tipos compartidos entre main y renderer

Base de datos
  └── prisma/schema.prisma, migrations/, seed.ts
```

**Flujo de datos:** `React UI → window.api.X() → IPC (preload) → ipcMain.handle → Service → Prisma → SQLite`

El renderer nunca accede a Prisma directamente; toda la lógica de negocio vive en `src/main/services/`.

## Desarrollo local

Requisitos: Node.js 20+, npm.

```bash
# Clonar e instalar dependencias
git clone https://github.com/ospinajohn/horizonte-app.git
cd horizonte-app
npm install

# Preparar base de datos de desarrollo
npm run db:migrate:dev
npm run db:seed

# Levantar en modo desarrollo
npm run dev
```

Otros comandos útiles:

```bash
npm run build       # compila main + preload + renderer
npm run package      # genera el instalador de Windows localmente (sin publicar)
npm run test         # tests unitarios (Vitest)
npm run test:e2e     # tests end-to-end (Playwright)
npm run db:studio    # abre Prisma Studio
```

## Publicar una nueva versión

El repositorio incluye un workflow de GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml))
que compila el instalador de Windows y lo publica como Release automáticamente:

```bash
# 1. Sube la versión en package.json (ej. 1.0.0 → 1.0.1)
npm version patch   # o minor / major

# 2. Sube el commit y el tag creado por npm version
git push && git push --tags
```

Al detectar el push de un tag `v*`, el workflow compila la app y sube el instalador al Release
correspondiente de GitHub. Todas las instalaciones existentes lo detectarán automáticamente (ver
[Actualizaciones automáticas](#-actualizaciones-automáticas)).

## Base de datos

- **Desarrollo:** `prisma/dev.db`
- **Producción:** `userData/database/horizonte.db` (ruta gestionada por `src/main/database/client.ts`)

Todos los modelos (`Account`, `Transaction`, `RecurringItem`, `Budget`, `SavingsGoal`, `CreditCard`,
`Credit`, `Asset`, `Liability`, etc.) están definidos en [`prisma/schema.prisma`](prisma/schema.prisma).

## Licencia

Proyecto de uso personal. Todos los derechos reservados.
