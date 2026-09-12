# GS Documentos v49

Versión preparada para carga en GitHub.

## Cambios principales
- Inicio de jornada: nombre, cédula y firma del técnico/gestor se capturan una sola vez; una jornada anterior pendiente bloquea el inicio de otra.
- Registro: agrega **Documentos pendientes**, **Condiciones de seguridad** (multiselección que permanece abierta) y **Plantas**.
- Excel de jornada: exactamente las 29 columnas acordadas, incluyendo los tres campos nuevos.
- JSON SharePoint: 14 campos únicamente: ID_REGISTRO, Orden_RO, Nombres, Identificacion, Contacto, Direccion, localidad, Sector_Barrio, Tipo_Zona, Tipo_poblacion, Documento_propiedad, Latitud_Y, Longitud_X, Precision_m.
- ID_REGISTRO: UUID generado localmente para permitir varios celulares y trabajo offline sin colisiones prácticas.
- RO: validación de 10 dígitos + bloqueo por duplicado dentro de la jornada; se vuelve a validar antes de exportar/cerrar.
- Exportación: dos archivos separados, `Recibo_tecnico_<Sector>_<Fecha>.xlsx` y `GS_Registro_<Sector>_<Fecha>.json`.
- Registros: estado visible **Pendiente de exportar** y acción **Cerrar y exportar jornada**.
- TD: integra la plantilla final `Constancia_TD` en el ZIP de cada usuario, rellena datos, documentos pendientes, EC y firmas; el límite MaxLen de Hallazgos se elimina al generar.
- La firma del técnico se conserva al pasar al siguiente usuario y se limpia al cerrar la jornada.

## SharePoint
Destino previsto: lista `Registro_Recibos técnicos` en Gestión Social. El JSON queda listo para un flujo estándar de Power Automate basado en carpeta de entrada.

## Nota offline
Las librerías JSZip, pdf-lib y XLSX siguen cargándose por CDN como en v48; por tanto, el arranque en frío sin conexión todavía no queda garantizado.
