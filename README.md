# SUR Task Manager

App web estática (sin dependencias). Abrir `index.html` o servir la carpeta (`npx http-server`).

- **Tablero**: tareas del mes generadas desde empresa × proceso × periodicidad (semanal = una por lunes del mes, quincenal = 2, mensual = 1). Estados: Pendiente / En curso / Bloqueada / Hecha, con nota.
- **Empresas**: alta/edición/baja; por empresa se define qué procesos tiene y cada cuánto.
- **Procesos**: catálogo (agregar/renombrar/eliminar).
- Datos en `localStorage` del navegador; usar Exportar/Importar para respaldo. `seed.js` se genera del Excel con `python3 tools/build_seed.py`.
