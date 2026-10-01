# GS Documentos v74

Corrección funcional sobre la base oficial v73.

## Cambios
- APPLUS NORCONTROL COLOMBIA LTDA queda como único aliado operativo; se elimina la necesidad de escoger contratista.
- E1 mantiene el comportamiento acordado: se diligencia la sección I de la primera página; no se autocompleta la sección II de propietario.
- E6 conserva los datos fijos ya incluidos en la plantilla; la app solo completa los campos variables.
- RETIE: la fecha de la Resolución 40117 se corrige a 02/04/2024 en la generación.
- Garrawall y arriostre quedan independientes.
- Guardado de registros reforzado con verificación posterior en almacenamiento local.
- El exporte de jornada toma todos los registros pendientes, no solo los del día cuando existen registros actuales.
- Excel ampliado con ID de registro, fecha/hora de creación, estado de sincronización y campos adicionales disponibles.
- El cierre de jornada espera a que finalice el exporte antes de ofrecer la limpieza local.
- La generación documental deja de usar el aplanado/reincrustado agresivo de v73.
- Si un documento falla, los demás pueden generarse y el ZIP incorpora ERRORES_GENERACION.txt con el detalle.
- Caché PWA y empaquetado Android actualizados a v74.

## Validación
GitHub Actions compila v74 correctamente. El entorno actual no tiene configurados los secretos de firma release, por lo que el artefacto producido es TEMP/debug y no debe tratarse como actualización release para campo.

## Plantillas
La lógica v74 está preparada para las plantillas revisadas. Los PDF/base64 definitivos deben incorporarse solamente después de la aprobación de Gestión Social.
