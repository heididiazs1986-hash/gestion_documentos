# GS Documentos v78 - memoria segura

**Problema:** `QuotaExceededError ... 'GS_DOCS_V49'`. El navegador deja ~5 MB por app y se llenaban con las firmas
(imágenes) que se guardaban repetidas: en cada registro, en el estado de la jornada y en el registro abierto.

**Solución (`v78-storage-fix.js`, sin perder datos):**
- Cada firma se guarda **una sola vez** (`GS_DOCS_FIRMAS_V1`); el resto son referencias `sig:ID` que se expanden al leer.
- La base TXT se guarda en formato compacto.
- Las firmas nuevas se normalizan a 800 px de ancho.
- Medidor de memoria (aparece desde 60 %) y ventana de ayuda: «Reducir tamaño de firmas» y «Exportar jornada».
- Migración automática al abrir: los datos existentes se compactan por tandas sin necesitar espacio libre.

Se carga por `sw.js` (igual que v77) y en el APK por `scripts/prepare_apk.py`.
