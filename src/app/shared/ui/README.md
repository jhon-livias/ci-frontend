# UI compartida

Componentes presentacionales reutilizables. No conocen endpoints, sesión ni
reglas de negocio. Agrega aquí `input`, `select`, `dialog`, `table`, `alert` y
otros primitives después de que el diseño de Figma los defina.

Disponibles: `ui-button`, `ui-field`, `ui-select`, `ui-card`, `ui-badge` y
`ui-alert`. Los campos exponen `model()` para el binding bidireccional
`[(value)]`; un formulario conectado a backend añadirá su Adapter y validación
de dominio en la feature correspondiente.
