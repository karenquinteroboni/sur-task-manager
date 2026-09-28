"""Genera seed.js a partir de data/EMPRESAR_CARTERA_A.xlsx (pip install openpyxl)."""
import json, sys, openpyxl
src = sys.argv[1] if len(sys.argv) > 1 else "data/EMPRESAR_CARTERA_A.xlsx"
ws = openpyxl.load_workbook(src).active
empresas, catalogo = [], []
for i, r in enumerate(ws.iter_rows(min_row=2, values_only=True), 1):
    if not r[0]:
        continue
    dash = lambda v: "" if v in (None, "—") else str(v)
    procs = []
    for j in range(10, 20, 2):
        if r[j]:
            procs.append({"proceso": r[j], "periodicidad": r[j + 1]})
            if r[j] not in catalogo:
                catalogo.append(r[j])
    empresas.append({"id": f"e{i}", "nombre": r[0], "grupo": dash(r[1]), "rut": r[2], "tipo": r[3],
                     "estado": r[4], "complejidad": r[5], "servicio": r[6], "finanzas": dash(r[7]),
                     "contabilidad": dash(r[8]), "carga": r[9], "procesos": procs})
with open("seed.js", "w", encoding="utf-8") as f:
    f.write("window.SEED = " + json.dumps({"empresas": empresas, "catalogo": catalogo}, ensure_ascii=False, indent=1) + ";\n")
print(len(empresas), "empresas,", len(catalogo), "procesos")
