# GS Documentos v76 - release firmada

Estado: código v76 en `main` y APK release preparada con la firma oficial histórica de GS Documentos.

- Application ID: `com.heididiaz.gsdocumentos`
- Alias: `gsdocumentos`
- Certificado SHA-256: `0A:13:65:F5:B7:DE:E0:91:E7:2C:1B:E2:8E:76:1A:B6:63:D1:F1:A8:6F:13:5A:76:7F:21:37:89:C2:07:F8:0A`
- SHA-256 del APK release v76 preparado: `a13e30ac05c298604d1fb0d91a7fe473f8ac6bc6939d71587cfb13b55fbd864b`
- La firma coincide con la utilizada en v72.
- El workflow queda bloqueado para no publicar APK debug cuando falten los secretos de firma.
- La clave privada no se almacena en el repositorio.

Para futuras compilaciones automáticas deben mantenerse configurados los cuatro secretos de firma definidos en `README_ANDROID_SIGNING.md`.
