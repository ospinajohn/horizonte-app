/** Stub mínimo del módulo 'electron' para poder importar código del main process en tests unitarios (Vitest corre en Node puro, no dentro de Electron). */
export const app = {
  getPath: () => process.cwd()
}
