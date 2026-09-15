# Firma estable Android - GS Documentos

GS Documentos debe distribuirse siempre como APK **release firmada con la misma clave privada estable**.

## Regla de continuidad

No se debe reemplazar la firma release por una firma debug ni generar una APK de distribución con una clave distinta. Android solo acepta una nueva versión como actualización cuando conserva el mismo `applicationId` y la misma firma.

- Application ID: `com.heididiaz.gsdocumentos`
- Alias de firma oficial: `gsdocumentos`
- Certificado SHA-256 oficial: `0A:13:65:F5:B7:DE:E0:91:E7:2C:1B:E2:8E:76:1A:B6:63:D1:F1:A8:6F:13:5A:76:7F:21:37:89:C2:07:F8:0A`
- Vigencia del certificado: 15/09/2026 a 31/01/2054

La clave privada **no debe subirse al repositorio público**. Debe conservarse fuera de GitHub y cargarse únicamente como secreto de GitHub Actions.

## Secretos requeridos en GitHub Actions

- `GS_ANDROID_KEYSTORE_B64`
- `GS_ANDROID_KEYSTORE_PASSWORD`
- `GS_ANDROID_KEY_ALIAS`
- `GS_ANDROID_KEY_PASSWORD`

Cuando estos cuatro secretos estén configurados, el workflow debe compilar una APK release usando esta firma. Si falta alguno, no debe publicarse una APK como versión instalable definitiva.

## Permisos Android incluidos

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `WRITE_EXTERNAL_STORAGE` solo para Android 9 o anterior

El permiso de ubicación se solicita cuando la WebView ejecuta la captura GPS.
