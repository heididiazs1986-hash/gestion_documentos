# GS Documentos v76

Corrección integral y validada sobre v75 para uso operativo APPLUS.

- APPLUS NORCONTROL COLOMBIA LTDA es el único aliado; no se requiere selector de contratista.
- Se usan exclusivamente las plantillas aprobadas E1, E6, AR, DJ, RETIE, EC y TD cargadas en templates/base64.
- E1 conserva el comportamiento acordado y no autocompleta la sección II del propietario.
- E6 respeta los textos fijos de la plantilla y completa solo los campos variables; el nombre del técnico/gestor se toma de la jornada.
- AR fue remapeado contra los nombres reales de sus campos editables.
- RETIE usa la plantilla corregida con Resolución 40117 de 02/04/2024.
- EC reemplaza correctamente el marcador {{CUADRO_CARGAS}} sin dejarlo visible ni duplicar la tabla.
- Guardado de registros con verificación posterior; exporte Excel/JSON toma todos los registros y conserva campos adicionales.
- Los botones de guardar, exportar, cerrar jornada y generar se rebindean sin listeners antiguos.
- Garrawall y arriostre permanecen independientes sin listeners heredados.
- El generador no tumba todo el ZIP si un documento falla: deja ERRORES_GENERACION.txt.
- El APK incluye JSZip, pdf-lib y XLSX localmente para que generación documental y Excel no dependan de internet.
- GitHub Actions valida sintaxis, plantillas, campos PDF y marcador EC antes de compilar.
