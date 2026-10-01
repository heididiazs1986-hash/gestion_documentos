# GS Documentos v75

Versión integral sobre la base oficial v74, preparada con las plantillas aprobadas por Gestión Social.

## Correcciones funcionales
- APPLUS NORCONTROL COLOMBIA LTDA queda como único aliado operativo. Se elimina la selección de contratista.
- Inicio de jornada ya no depende del selector oculto de contrato.
- Garrawall y arriostre permanecen independientes.
- Guardado de registros reforzado con verificación posterior en almacenamiento local.
- El exporte de Excel y JSON toma todos los registros pendientes y conserva todas las columnas disponibles.
- El cierre de jornada espera a que finalice el exporte antes de permitir limpieza local.
- La generación ZIP continúa aunque un documento individual falle y agrega ERRORES_GENERACION.txt con el detalle.

## Plantillas aprobadas
- E1 actualizado. En la primera página la app diligencia únicamente la sección I; no autocompleta la sección II de propietario.
- E6 actualizado. Los textos y valores fijos de la plantilla se respetan; solo se completan campos variables.
- AR actualizado.
- DJ actualizado.
- RETIE actualizado con Resolución 40117 de 02/04/2024.
- EC APPLUS actualizado.
- Constancia TD reemplazada por la versión aprobada por Gestión Social.

## Generación documental
- Las plantillas ya no dependen de los Base64 antiguos embebidos en index.html.
- E1 se reconstruye localmente desde fragmentos Base64 incluidos en la APK/PWA.
- E6, AR, DJ, RETIE y TD se cargan directamente desde las plantillas aprobadas del paquete.
- EC usa exclusivamente la plantilla APPLUS aprobada.
- Los PDF se guardan sin el aplanado/reincrustado agresivo que afectó el renderizado en v73.

## Android/PWA
- versionCode 75
- versionName 75.0
- caché PWA gs-docs-v75
- build GitHub Actions actualizado para incluir templates/** y v75-fix.js
