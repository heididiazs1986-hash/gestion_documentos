# GS Documentos v55

Cambios principales:
- Estado técnico condicionado por “Requiere instalación externa” y “Requiere instalación interna”.
- Si la instalación externa está en NO, solo aparecen los estados externos marcados como NO en la tabla maestra.
- Si la instalación externa está en SÍ, aparecen los estados asociados a los elementos externos seleccionados y los estados comodín “TODOS”.
- Los estados internos se filtran de forma independiente según el SÍ/NO de instalación interna.
- “TODOS” y “NO APLICA” funcionan únicamente como comodines internos y no aparecen en el campo de elementos requeridos.
- El campo de elementos externos conserva solo: Acometida, Ducto 1" Galv., Celda, Interruptor y Sistema puesta a tierra.
- Al cambiar una condición o quitar un elemento, se eliminan automáticamente los estados técnicos que hayan dejado de ser válidos, junto con su texto automático en Observaciones.
- Caché PWA, manifest y exportación JSON actualizados a v55.
