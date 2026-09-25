from pathlib import Path
import os
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
WWW = ROOT / "www"


def prepare_web():
    if WWW.exists():
        shutil.rmtree(WWW)
    WWW.mkdir(parents=True)

    for name in [
        "index.html", "manifest.json", "sw.js", "v73-render-fix.js",
        "gs-docs-icon-192.png", "gs-docs-icon-512.png", "gs-suite-logo.png",
        "icon-180.png", "icon-192.png", "icon-512.png"
    ]:
        src = ROOT / name
        if src.exists():
            shutil.copy2(src, WWW / name)

    templates = ROOT / "templates"
    if templates.exists():
        shutil.copytree(templates, WWW / "templates")

    html_path = WWW / "index.html"
    html = html_path.read_text(encoding="utf-8")

    old_download = "function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}"
    new_download = """async function downloadBlob(blob,name){
      if(window.AndroidDownloader&&typeof window.AndroidDownloader.saveBase64==='function'){
        const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('No fue posible preparar la descarga'));r.readAsDataURL(blob)});
        const base64=String(dataUrl).split(',')[1]||'';
        const ok=window.AndroidDownloader.saveBase64(name,blob.type||'application/octet-stream',base64);
        if(ok===false)throw new Error('Android no pudo guardar el archivo');
        return;
      }
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)
    }"""
    if old_download not in html:
        raise RuntimeError("No se encontró downloadBlob en index.html; se detiene para no modificar una versión inesperada")
    html = html.replace(old_download, new_download, 1)

    old_call = "lastGeneratedFile={blob,name,scope};\n      downloadBlob(blob,name);"
    new_call = "lastGeneratedFile={blob,name,scope};\n      await downloadBlob(blob,name);"
    if old_call not in html:
        raise RuntimeError("No se encontró la llamada esperada a downloadBlob")
    html = html.replace(old_call, new_call, 1)

    hotfix_tag = '<script src="./v73-render-fix.js?v=gsdoc-v73"></script>'
    if hotfix_tag not in html:
        html = html.replace("</body>", hotfix_tag + "\n</body>")

    html_path.write_text(html, encoding="utf-8")
    print("Web v73 preparada para Android")


def prepare_android():
    android = ROOT / "android"
    if not android.exists():
        raise RuntimeError("No existe android/. Ejecuta 'npx cap add android' primero")

    package_dir = android / "app/src/main/java/com/heididiaz/gsdocumentos"
    package_dir.mkdir(parents=True, exist_ok=True)

    main_activity = r'''package com.heididiaz.gsdocumentos;

import android.Manifest;
import android.os.Build;
import android.os.Bundle;
import android.content.pm.PackageManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidDownloader(this), "AndroidDownloader");
        }
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
            checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 70);
        }
    }
}
'''
    (package_dir / "MainActivity.java").write_text(main_activity, encoding="utf-8")

    downloader = r'''package com.heididiaz.gsdocumentos;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class AndroidDownloader {
    private final Context context;

    AndroidDownloader(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public boolean saveBase64(String fileName, String mimeType, String base64) {
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = context.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType == null || mimeType.isEmpty() ? "application/octet-stream" : mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new Exception("No se pudo crear el archivo en Descargas");
                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out == null) throw new Exception("No se pudo abrir el archivo de salida");
                    out.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            } else {
                File folder = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!folder.exists() && !folder.mkdirs()) throw new Exception("No se pudo abrir la carpeta Descargas");
                File target = new File(folder, fileName);
                try (FileOutputStream out = new FileOutputStream(target)) {
                    out.write(bytes);
                }
            }
            Toast.makeText(context, "Guardado en Descargas: " + fileName, Toast.LENGTH_LONG).show();
            return true;
        } catch (Exception e) {
            Toast.makeText(context, "No se pudo guardar: " + e.getMessage(), Toast.LENGTH_LONG).show();
            return false;
        }
    }
}
'''
    (package_dir / "AndroidDownloader.java").write_text(downloader, encoding="utf-8")

    manifest = android / "app/src/main/AndroidManifest.xml"
    text = manifest.read_text(encoding="utf-8")
    permissions = [
        '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
        '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
        '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />'
    ]
    missing = [p for p in permissions if p not in text]
    if missing:
        text = text.replace("<application", "\n    ".join(missing) + "\n    <application", 1)
    text = re.sub(r'android:icon="[^"]+"', 'android:icon="@drawable/gs_documentos_icon"', text, count=1)
    text = re.sub(r'android:roundIcon="[^"]+"', 'android:roundIcon="@drawable/gs_documentos_icon"', text, count=1)
    manifest.write_text(text, encoding="utf-8")

    drawable = android / "app/src/main/res/drawable-nodpi"
    drawable.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "icon-512.png", drawable / "gs_documentos_icon.png")

    gradle = android / "app/build.gradle"
    g = gradle.read_text(encoding="utf-8")
    g = re.sub(r'versionCode\s+\d+', 'versionCode 73', g, count=1)
    g = re.sub(r'versionName\s+"[^"]+"', 'versionName "73.0"', g, count=1)

    signing_vars = [
        os.getenv("GS_ANDROID_KEYSTORE_PATH"),
        os.getenv("GS_ANDROID_KEYSTORE_PASSWORD"),
        os.getenv("GS_ANDROID_KEY_ALIAS"),
        os.getenv("GS_ANDROID_KEY_PASSWORD")
    ]
    if all(signing_vars):
        signing_block = '''    signingConfigs {\n        release {\n            storeFile file(System.getenv("GS_ANDROID_KEYSTORE_PATH"))\n            storePassword System.getenv("GS_ANDROID_KEYSTORE_PASSWORD")\n            keyAlias System.getenv("GS_ANDROID_KEY_ALIAS")\n            keyPassword System.getenv("GS_ANDROID_KEY_PASSWORD")\n        }\n    }\n'''
        if "signingConfigs {" not in g:
            g = g.replace("android {\n", "android {\n" + signing_block, 1)
        if "signingConfig signingConfigs.release" not in g:
            g = re.sub(r'(release\s*\{)', r'\1\n            signingConfig signingConfigs.release', g, count=1)
        print("Firma release estable habilitada")
    else:
        print("Firma release no configurada: se generará APK debug de prueba")

    gradle.write_text(g, encoding="utf-8")
    print("Proyecto Android v72 preparado con permisos GPS y descargas directas")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"web", "android"}:
        raise SystemExit("Uso: python scripts/prepare_apk.py [web|android]")
    prepare_web() if sys.argv[1] == "web" else prepare_android()
