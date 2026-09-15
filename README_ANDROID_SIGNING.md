# Firma estable Android - GS Documentos

El repositorio compila una APK debug si no existen secretos de firma y una APK release firmada cuando están configurados.

## Secretos requeridos en GitHub Actions

- `GS_ANDROID_KEYSTORE_B64`
- `GS_ANDROID_KEYSTORE_PASSWORD`
- `GS_ANDROID_KEY_ALIAS`
- `GS_ANDROID_KEY_PASSWORD`

La clave privada **no debe subirse al repositorio**. Debe conservarse fuera de GitHub y cargarse únicamente como secreto.

Con los cuatro secretos configurados, el workflow `.github/workflows/build-apk.yml` compila `GS_Documentos_v71_RELEASE.apk`. Las versiones futuras deben usar la misma clave para que Android las acepte como actualización y conserve los datos de la app.

## Permisos Android incluidos

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `WRITE_EXTERNAL_STORAGE` solo para Android 9 o anterior

El permiso de ubicación se solicita cuando la WebView ejecuta la captura GPS.
