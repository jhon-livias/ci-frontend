# UI compartida

Componentes presentacionales reutilizables. No conocen endpoints, sesión ni
reglas de negocio. Agrega aquí `input`, `select`, `dialog`, `table`, `alert` y
otros primitives después de que el diseño de Figma los defina.

Disponibles: `ui-button`, `ui-field`, `ui-select`, `ui-stepper`, `ui-confirm`, `ui-card`, `ui-badge`,
`ui-alert` y `ui-table`. El stepper recibe `steps` y `active`, y emite `stepChange`.
La confirmación recibe `message` y `details`, y emite `confirmed` o `cancelled`. La tabla recibe `columns`, `rows` y opcionalmente
`totalItems`; expone los eventos `sortChange` y `pageChange` para enlazarla a
una fuente paginada. Los campos exponen `model()` para el binding bidireccional
`[(value)]`; un formulario conectado a backend añadirá su Adapter y validación
de dominio en la feature correspondiente.
