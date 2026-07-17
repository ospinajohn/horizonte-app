# Horizonte — Sistema de Diseño

> Referencia visual permanente. Todo componente, pantalla o ajuste visual debe seguir estas reglas.

---

## Identidad visual

**Concepto:** Financial Command Center — interfaz oscura, técnica y de alta densidad de información. Inspirada en dashboards de trading y herramientas financieras profesionales. Seria, limpia, con toques de color estratégicos para guiar la atención.

**Personalidad:** Confianza / Precisión / Control / Claridad

---

## Paleta de colores

### Colores de marca
| Token | Hex | Uso |
|---|---|---|
| `--brand-emerald` | `#10B981` | Acento principal, estados positivos, elementos activos |
| `--brand-mint` | `#3EB489` | Variante del acento, hover states |

### Fondos
| Token | Hex | Uso |
|---|---|---|
| `--bg-deep` | `#08090B` | Fondo global de la app |
| `--bg-card` | `#121418` | Fondo de cards y paneles |
| `--bg-sidebar` | `#0A0B0D` | Fondo del sidebar |
| `--bg-elevated` | `#0F1115` | Superficies elevadas, modales |

### Bordes
| Token | Valor | Uso |
|---|---|---|
| `--border-pro` | `rgba(255,255,255,0.05)` | Borde estándar de cards |
| `--border-subtle` | `rgba(255,255,255,0.03)` | Divisores internos |
| `--border-accent` | `rgba(16,185,129,0.2)` | Borde de elementos con acento |

### Texto
| Clase | Color | Uso |
|---|---|---|
| Primario | `#FFFFFF` | Títulos, valores importantes |
| Secundario | `#9CA3AF` (gray-400) | Descripciones, subtítulos |
| Terciario | `#4B5563` (gray-600) | Labels, placeholders, iconos inactivos |
| Positivo | `#10B981` | Valores positivos, ingresos, crecimientos |
| Negativo | `#F43F5E` (rose-500) | Deudas, valores negativos, alertas críticas |
| Warning | `#F59E0B` (amber-500) | Advertencias, presupuestos al límite |
| Info | `#60A5FA` (blue-400) | Información, proyecciones, items programados |

### Colores semánticos financieros
| Estado | Color | Uso |
|---|---|---|
| Ingreso | `#10B981` | Cualquier entrada de dinero |
| Gasto | `#F43F5E` | Cualquier salida de dinero |
| Transferencia | `#60A5FA` | Movimientos entre cuentas |
| Deuda | `#F43F5E` | Obligaciones financieras |
| Ahorro | `#10B981` | Metas y fondos de ahorro |
| Proyección | `#60A5FA` | Valores futuros estimados |
| Neutral | `#6B7280` | Sin variación o sin categoría |

---

## Tipografía

### Familias
| Familia | Variable CSS | Uso |
|---|---|---|
| **Plus Jakarta Sans** | `font-plus` | Títulos grandes, balances principales, headings |
| **Inter** | `font-sans` (default) | Todo el texto de UI, labels, body |
| **JetBrains Mono** | `font-mono` | Valores técnicos, timestamps, terminal/logs, latencia |

### Escala tipográfica
| Tamaño | Clase Tailwind | Uso |
|---|---|---|
| `10px` | `text-[10px]` | Labels uppercase, tracking amplio (`tracking-widest`) |
| `11px` | `text-[11px]` | Sub-labels, metadata |
| `12px` | `text-xs` | Body pequeño, badges |
| `14px` | `text-sm` | Body estándar, descripciones |
| `16px` | `text-base` | Texto de contenido |
| `20px` | `text-xl` | Subtítulos de cards |
| `24px` | `text-2xl` | Valores secundarios importantes |
| `32px` | `text-4xl` / `text-[2.5rem]` | Títulos de sección |
| `48px-64px` | `text-5xl` / `text-6xl` | Scores, métricas de salud |
| `96px` | `text-8xl` / `text-[6rem]` | Balance principal (hero number) |

### Convenciones
- Labels informativos: siempre **UPPERCASE** + `tracking-widest` + `font-bold`
- Valores monetarios: fuente **Plus Jakarta Sans** + `font-bold`
- Porcentajes y scores: fuente **Plus Jakarta Sans** + `font-bold`
- Logs/terminal: **JetBrains Mono** + `text-[10px]`
- El símbolo `$` siempre va en `text-gray-600 font-light` junto al número principal

---

## Espaciado y layout

### Grid del dashboard
- Container max: `max-w-[1600px]`
- Padding interno: `p-12` (48px)
- Gap entre secciones: `space-y-12` (48px)
- Gap entre cards en grid: `gap-8` (32px)
- Padding interno de cards: `p-10` (40px)

### Sidebar
- Ancho fijo: `w-24` (96px) — icónico, sin labels de texto
- Padding vertical: `py-10`
- Logo: `w-12 h-12`, `rounded-2xl`
- Nav items: `w-14 h-14`, centrado
- Sin texto de navegación — solo iconos

### Border radius
| Elemento | Clase |
|---|---|
| Cards premium | `rounded-[28px]` |
| Botones principales | `rounded-2xl` |
| Badges / chips | `rounded-2xl` |
| Iconos containers | `rounded-2xl` |
| Progress bars | `rounded-full` |
| Avatar usuario | `rounded-full` |
| Chart container | `rounded-[32px]` |
| Inputs | `rounded-2xl` |

---

## Cards

### `premium-card` — Card base del sistema
```css
background: #121418;
border: 1px solid rgba(255, 255, 255, 0.05);
border-radius: 28px;
box-shadow: 0 4px 24px rgba(0,0,0,0.2);
```

### Variantes de card
| Variante | Uso |
|---|---|
| Default (`premium-card`) | La mayoría de contenido |
| Con glow verde | Cards principales (balance total) — `absolute glow bg-emerald/5 blur-[100px]` |
| Con borde accent | Terminal / decisiones — `border-emerald-500/20` |
| Gradient bg | Cards de proyección — `from-[#121418] to-[#0A0B0E]` |
| Con overlay oscuro | Charts — `bg-black/20` |

---

## Componentes clave

### Sidebar navigation
- Icono activo: `nav-active-pro` — fondo `emerald/8`, texto emerald, `rounded-2xl`
- Icono inactivo: `text-gray-600 hover:text-white`
- Logo: fondo emerald sólido + sombra `shadow-[0_0_25px_rgba(16,185,129,0.4)]`

### Badges / Pills
- Positivo (growth): `bg-emerald-500/10 text-emerald border border-emerald-500/20`
- Warning: `bg-amber-500/10 text-amber-500 border border-amber-500/20`
- Danger: `bg-rose-500/10 text-rose-500 border border-rose-500/20`
- Info: `bg-blue-500/10 text-blue-400 border border-blue-500/20`

### Progress bars
- Track: `bg-white/5` — extremadamente sutil
- Fill positivo: `bg-emerald` + `shadow-[0_0_10px_#10B981]` (glow)
- Fill info: `bg-blue-500`
- Fill warning: `bg-amber-500`
- Fill danger: `bg-rose-500`
- Altura: `h-1.5` (6px) — delgada y elegante

### Botones
| Variante | Estilo |
|---|---|
| Primary | `bg-emerald text-black font-bold shadow-lg shadow-emerald/20` |
| Secondary | `bg-white/5 border border-white/10 hover:bg-white/10` |
| Ghost | `text-emerald hover:underline` |
| Circular | `w-12 h-12 bg-white text-black rounded-full` |
| Toggle activo | `bg-emerald text-black rounded-xl` |
| Toggle inactivo | `text-gray-500 hover:text-white` |

### Separadores
- `h-10 w-px bg-white/5` — línea vertical entre stats

### Dot pulse (indicador activo)
```css
animation: pulse 2s infinite;
/* glow animado color emerald */
```

### Grid overlay (fondo de la main area)
```css
background-image:
  linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
background-size: 40px 40px;
```

---

## Iconografía

**Librería principal:** Lucide React (ya instalada en el proyecto)

**Convenciones de tamaño:**
| Contexto | Tamaño |
|---|---|
| Sidebar nav | `size={24}` |
| Card headers | `size={20}` |
| Inline con texto | `size={16}` o `size={14}` |
| Hero icons | `size={28}` o `size={32}` |

**Mapeado de iconos clave del sistema:**
| Concepto | Lucide icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Transacciones | `Receipt` |
| Planificador / timeline | `CalendarClock` |
| Metas | `Target` |
| Analítica | `Activity` |
| Configuración | `Settings` |
| Wallet / Liquidez | `Wallet` |
| Salud financiera | `HeartPulse` |
| Decisiones | `Lightbulb` |
| Terminal / log | `Terminal` |
| Ingreso | `TrendingUp` |
| Gasto | `TrendingDown` |
| Transferencia | `ArrowLeftRight` |
| Crédito | `CreditCard` |
| Meta ahorro | `PiggyBank` |
| Alerta | `AlertTriangle` |
| Calendario | `CalendarDays` |
| Presupuesto | `BarChart3` |
| Suscripciones | `Repeat` |
| Reportes | `FileText` |

---

## Gráficas (Recharts)

### Estilo global de gráficas
```tsx
// Colores del tema
const CHART_COLORS = {
  emerald: '#10B981',
  blue: '#60A5FA',
  rose: '#F43F5E',
  amber: '#F59E0B',
  purple: '#A78BFA',
}

// Sin grid lines visibles por defecto (salvo analítica detallada)
// CartesianGrid: strokeDasharray="1 8" stroke="rgba(255,255,255,0.05)"
// Tooltip: fondo oscuro, borde sutil, sin sombras agresivas
// Axes: texto gray-600, sin línea de eje visible
```

### Tipos de gráficas por módulo
| Módulo | Gráfica |
|---|---|
| Dashboard — flujo | `AreaChart` — área verde con glow |
| Dashboard — gastos cat. | `PieChart` / donut |
| Analítica — ingresos vs gastos | `BarChart` agrupado |
| Planificador — proyección | `AreaChart` — positivo verde / negativo rojo |
| Salud financiera | SVG circular gauge custom |
| Patrimonio | `AreaChart` histórico |
| Endeudamiento | Gauge circular + `LineChart` |

### Telemetry chart (hero chart del dashboard)
- Fondo: `bg-black/20 rounded-[32px] border border-white/5`
- Línea: stroke emerald, `strokeWidth=4`, con `filter: drop-shadow(0 0 12px rgba(16,185,129,0.6))`
- Área: gradiente emerald → transparente, `opacity: 0.1`
- Puntos: círculos emerald `r=5`, el punto final blanco `r=6` con `drop-shadow`
- Tooltip flotante: `bg-black/80 border border-white/10 backdrop-blur-md rounded-2xl`
- Ejes X: texto `font-mono text-[10px] text-gray-600 uppercase tracking-widest`

---

## Animaciones

### Entrada de cards
```tsx
// GSAP — stagger entrance desde abajo
gsap.from(".premium-card", {
  y: 50, opacity: 0, duration: 1.2,
  stagger: 0.12, ease: "expo.out", delay: 0.2
})
```
En React: usar `framer-motion` con variantes de entrada o CSS `animate-fade-in` con delay incremental.

### Count-up animation
- Balance principal: 0 → valor real, duración 2.5s, ease out
- Health score: 0 → valor, duración 2s, delay 1s
- Implementación React: hook `useCountUp` con `requestAnimationFrame`

### Path drawing (chart)
- La línea del telemetry chart se dibuja de izquierda a derecha al cargar
- `strokeDasharray` + `strokeDashoffset` animado a 0
- Duración: 3s, delay 0.8s, ease inOut

### Hover states
- Cards: sin transform — solo cambios de opacidad en elementos internos
- Botones: `transition-all duration-200`
- Sidebar icons: `transition-all`
- Botón circular: `hover:scale-105`

---

## Terminal / Decision Log

Estilo específico del widget Decision_Log:
- Fondo: `bg-black/40` + borde `border-emerald-500/20`
- Fuente: `font-mono text-[10px] text-gray-400`
- Estado `[SAFE]`: `text-emerald`
- Estado `[WARN]`: `text-amber-500`
- Estado `[INFO]`: `text-blue-400`
- Estado `[ERR]`: `text-rose-500`

---

## Header de página

```
[Label pequeño UPPERCASE tracking-widest emerald]
[Título grande Plus Jakarta Sans extrabold]
                        [Latency indicator] [Export button]
```

- Label: `text-[10px] font-bold text-emerald uppercase tracking-[0.4em]`
- Título: `text-4xl font-plus font-extrabold tracking-tight`
- Texto "System Active": parte del label con `//` como separador técnico

---

## Reglas de uso

1. **Nunca usar fondos blancos** — la app es siempre dark
2. **Sin sombras de colores brillantes** salvo en el glow del logo y el glow del chart
3. **Spacing consistente** — todo múltiplo de 8px (2 en Tailwind)
4. **Los valores en rojo siempre son deudas o negativos** — nunca usar rose para otra cosa
5. **Los valores en azul son siempre proyecciones o items programados** — no para datos actuales
6. **El verde emerald es el único acento de marca** — no agregar otros colores de acento
7. **Labels siempre UPPERCASE** cuando son descriptores de métricas
8. **No usar borders gruesos** — máximo `border` (1px), siempre con opacidad baja
9. **El sidebar es solo iconos** — sin texto, sin tooltips elaborados
10. **Density máxima en el dashboard** — mostrar toda la información clave sin scroll si es posible

---

## Estructura de archivos de componentes

```
src/renderer/src/
├── components/
│   ├── layout/
│   │   ├── TitleBar.tsx         ✅ creado
│   │   ├── Sidebar.tsx          ← nav principal
│   │   └── AppLayout.tsx        ← wrapper con sidebar + content
│   ├── dashboard/
│   │   ├── LiquidityCard.tsx    ← balance + ingresos/gastos/deuda
│   │   ├── PaydayCard.tsx       ← próxima quincena
│   │   ├── TelemetryChart.tsx   ← chart hero con proyección
│   │   ├── HealthGauge.tsx      ← score salud financiera circular
│   │   ├── DecisionLog.tsx      ← terminal de decisiones
│   │   ├── GoalsCard.tsx        ← metas de ahorro progress
│   │   ├── SmartDecisionCard.tsx← "¿Puedo comprar esto?"
│   │   └── DashboardPage.tsx    ← página principal
│   └── ui/
│       ├── button.tsx           ✅
│       ├── card.tsx             ✅
│       ├── badge.tsx            ✅
│       ├── separator.tsx        ✅
│       ├── skeleton.tsx         ✅
│       ├── progress.tsx         ← barra de progreso financiera
│       ├── input.tsx            ← input estilizado
│       └── tooltip.tsx          ← tooltip sutil
```
