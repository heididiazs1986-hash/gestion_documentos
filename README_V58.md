# GS Documentos v58

Cambios sobre v57:

- Se agrega `Instalación completa` como opción visible en `Elementos requeridos de instalación externa`.
- Los cinco elementos individuales siguen siendo: Acometida, Ducto 1" Galv., Celda, Interruptor y Sistema puesta a tierra.
- Se pueden seleccionar manualmente hasta cuatro elementos individuales. Al seleccionar el quinto, la app reemplaza automáticamente los cinco por `Instalación completa`.
- `Instalación completa` es excluyente: al seleccionarla se limpian los elementos individuales; si luego se selecciona un elemento individual, se desmarca `Instalación completa`.
- Cuando la selección es `Instalación completa`, el motor técnico la interpreta como los cinco elementos externos y habilita todos los estados de instalación externa correspondientes al valor Sí/No de `Requiere instalación externa`, incluidos los vinculados al comodín interno `Todos los elementos de EXTERNA`.
- Los comodines internos `Todos los elementos de EXTERNA` e `Interna` continúan sin aparecer en el formulario.
- La constancia TD muestra `Instalación completa` como la selección externa y el cálculo de materiales la expande internamente a los cinco elementos para no perder materiales.
- Se conservan Garrawall y arriostre como controles Sí/No totalmente independientes.
- Se conserva `Todos los documentos fueron entregados` como opción excluyente en Documentos pendientes.
- Caché PWA, manifest y exportación JSON actualizados a v58.
