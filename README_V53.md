# GS Documentos v53

Ajuste de municipio/localidad sobre v52 sin modificar la lógica de materiales ni los flujos ya aprobados.

- APPLUS+: Municipio inicia en Bogotá, pero queda editable.
- INMEL: Municipio se selecciona entre Bogotá y municipios de Cundinamarca.
- Localidad se solicita únicamente cuando Municipio = Bogotá.
- Fuera de Bogotá, Localidad se maneja como "No aplica" en los documentos.
- Departamento se deriva automáticamente: Bogotá D.C. para Bogotá y Cundinamarca para los demás municipios.
- Municipio/Localidad se capturan una sola vez en el registro y se heredan a E1/E6/AR/DJ/RETIE/EC según sus campos.
- Orden RO continúa alimentando No. de solicitud del E1.
- Se conserva la automatización de materiales de v52, incluida la condición especial de curvas y uniones galvanizadas de 1 pulgada.
- Caché PWA actualizado a gs-docs-v53-1.
