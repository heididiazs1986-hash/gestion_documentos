# GS Documentos v55

Cambios principales:
- Estado técnico condicionado por instalación externa/interna y por los elementos realmente seleccionados.
- `TODOS` y `NO APLICA` quedan como comodines internos: nunca aparecen en Elementos requeridos para instalación externa.
- Elementos externos visibles: Acometida, Ducto 1" Galv., Celda, Interruptor y Sistema puesta a tierra.
- Observaciones automáticas del estado técnico se separan con ` | ` y conservan texto manual adicional.
- Registros guardados ahora se pueden editar y actualizar sin duplicar la Orden RO.
- Pantalla Registro guardado simplificada a tres acciones: Realizar documentos, Guardar y nuevo registro, Ver registros / exportar.
- Constancia TD reorganizada: Hallazgos ampliados, autorización compacta y aliado mostrado en un campo pequeño como APPLUS+ o INMEL.
- Exportación Excel de jornada usa nombre `Reporte_de_<sector>_<fecha>.xlsx`.
- Caché PWA y manifest actualizados a v55.


Corrección v55.1:
- El aliado estratégico deja de mostrarse como campo aislado en la Constancia TD y se integra en la frase legal: “desarrollado por ENEL y su aliado estratégico [ALIADO].”
- Se eliminan los botones adicionales de compartir/reintentar. Generar y Exportar abren directamente el menú nativo de compartir del celular cuando está disponible.
- El cierre de jornada queda en dos pasos: primero exporta y permanece en Registros; luego, después de verificar el envío/guardado, el mismo botón permite cerrar y limpiar la jornada.
- Si el equipo no admite Web Share con archivos, se usa descarga como respaldo sin limpiar ni cambiar de pantalla.
