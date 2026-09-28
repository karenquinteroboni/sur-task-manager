# SUR Task Manager

Página única en `artifact/index.html`, publicada como Artifact de Claude con base compartida (`db`).

**Recurrencia** (fecha elegida → regla → instancias): semanal = mismo día de la semana; quincenal = cada 14 días;
mensual = mismo día del mes (mes corto usa su último día); trimestral = cada 3 meses; anual; única.

**Datos**
- `empresas/<id>`: ficha + procesos con periodicidad y responsable.
- `config/catalogo`: los 5 procesos.
- `secuencias/<id>`: una por tarea recurrente (id común). `tramos[{desde,ancla}]` = reglas ("toda la secuencia"), `ex{fecha:{d}}` = "solo este día", `est{fecha:{e,n,r}}` = estado/nota/responsable por repetición. `origen`: `proceso` (id `<empresa>_<proceso>`) o `manual`.

Semilla desde el Excel: `tools/build_seed.py` genera `seed.js`.
