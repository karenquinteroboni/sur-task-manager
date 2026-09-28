# SUR Task Manager

Página única en `artifact/index.html`, publicada como Artifact de Claude con base compartida (`db`).

- **Tablero**: tareas del mes generadas desde empresa × proceso × periodicidad, con fecha límite, responsable, estado y nota.
- **Empresas**: cada empresa trae los 5 procesos; solo se edita periodicidad (o "No aplica"), fecha límite propia y responsable.
- **Procesos**: fecha límite predeterminada por proceso y periodicidad (se define una vez y se repite).
- Datos: colecciones `empresas`, `config/catalogo` y `estados/<YYYY-MM>`. Semilla desde el Excel: `tools/build_seed.py` genera `seed.js`.
