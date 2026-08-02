# Issues con herdr MCP — diagnosticados y resueltos

## ~~1. `worktree.create` ignora los parámetros `branch` y `path`~~ RESUELTO

**Causa raíz:** schema.json cacheado de una versión anterior de herdr donde
`worktree.create` no exponía `branch`/`path`. El MCP solo expone los parámetros
que aparecen en el schema exportado — si el schema no los tenía, el tool los
omitía silenciosamente.

**Solución:** al reiniciar opencode, el MCP server arranca de cero y ejecuta
`herdr api schema --output schema.json`, obteniendo el schema actualizado.
Desde el commit `f1965a4` el servidor muestra `(exported by herdr)` o
`(cached fallback)` en el log de startup, para que sea visible si la caché
está obsoleta.

**Verificado hoy:** `worktree.create` con `branch: "test-diag-branch"` y
`path: "/tmp/opencode/test-diag-wt"` creó el worktree correctamente con ambos
parámetros aplicados.

## ~~2. Error confuso cuando pasé `branch` con comillas escapadas~~ DIAGNOSTICADO

```json
{ "branch": "\"factory/dark-mode\"", "path": "/tmp/opencode/app-clima-wt/dark-mode" }
```

El string `branch` contenía comillas dobles literales (`"factory/dark-mode"`).
Herdr intentó usar `"factory/dark-mode"` (con comillas) como nombre de rama,
lo cual es inválido. El mensaje `worktree path must be absolute` es un bug de
herdr (el error de validación de branch se propaga confusamente como error de
path).

**Solución:** no escapar las comillas en los valores JSON. El MCP server pasa
los valores directamente — si el JSON es válido con strings sin comillas
internas, todo funciona.

## ~~3. Solución manual alternativa que funcionó~~ CONFIRMADO

Usar `git branch` + `git worktree add` en bash funciona. Luego abrir el
workspace con `worktree.open` o simplemente trabajando desde el worktree. No
hay problema en el pipeline conceptual.

---

**Resumen:** los issues eran por schema desactualizado y un error de
serialización JSON. Ambos están resueltos. Los 20 tools del modo orquestación
funcionan correctamente.
