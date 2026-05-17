# GS Documentos · Preliminar modular para revisión Codex

## Estado
Esta NO es la versión final PRO. Es una base preliminar funcional para que Codex revise y continúe la arquitectura modular.

## Objetivo del rediseño
Convertir GS Documentos de un formulario largo/infinito a una app modular tipo GS Diagnósticos:

1. Pantalla principal con selección documental.
2. Formulario dinámico único según documentos seleccionados.
3. Módulos separados: Materiales, Soportes, Firmas, Cargas y Generar.
4. Persistencia local automática para no perder información al cerrar/minimizar.
5. Limpieza de campos solo después de generar/guardar exitosamente.

## Reglas documentales

### Documentos seleccionables
- Todos los documentos
- Formato de solicitud E1
- Recibo técnico E6
- Aceptación de requisitos
- Declaración juramentada
- RETIE
- Esquema constructivo

### Datos generales
- DG-01 Nombre o Razón Social: TODOS
- DG-02 Fecha de solicitud de servicio: TODOS
- DG-03 Tipo de documento: TODOS
- DG-04 Número de Documento: TODOS
- DG-05 Dirección de quien radica: TODOS
- DG-06 Localidad del predio: TODOS
- DG-07 Departamento: TODOS
- DG-08 Municipio / Localidad: TODOS
- DG-09 Celular: TODOS
- DG-10 Correo electrónico: E1
- DG-11 Nombre del proyecto: E1, E6

### E1
- Tipo de persona
- Zona
- Longitud
- Latitud
- Indicaciones de acceso al predio
- Red eléctrica cercana
- Distancia a la red más cercana
- N° transformador/poste más cercano
- No. de solicitud
- Tipo de uso
- Otro. ¿Cuál?
- Estrato socioeconómico

### DJ
- Descripción del inmueble
- Ciudad de domicilio
- Fecha de posesión
- Origen de la posesión

### Técnico / RETIE
- Nombre del técnico: RETIE, E6, EC
- Matrícula profesional: RETIE, EC
- Identificación del constructor: RETIE
- Lugar de expedición: RETIE
- Profesión del constructor: RETIE
- Consejo profesional: RETIE
- Fecha de construcción: RETIE
- Dirección del constructor: RETIE
- Celular del constructor: RETIE
- Correo del constructor: RETIE

## Reglas de módulos
- Materiales: opcional, puede acompañar cualquier documento. No debe aparecer dentro del formulario principal.
- Soportes: opcional, puede acompañar cualquier documento. No debe aparecer dentro del formulario principal.
- Firmas: módulo aparte.
- Firma solicitante: E1, E6, AR, DJ.
- Firma técnico: RETIE, EC.
- Cargas: pertenece al Esquema constructivo (EC), solo debe verse si EC está seleccionado.
- En cuadro de cargas, OPERACIÓN equivale a FUERZA.
- Cuadro de cargas en pantalla debe mostrar solo Carga y Cantidad. El resumen debe sumar potencia W por tipo de circuito: Alumbrado, Calefacción, Fuerza, Total.

## UX esperada
- Botones grandes, limpios, estilo GS Diagnósticos.
- Evitar textos largos bajo los botones.
- No mostrar etiquetas visuales agresivas tipo “DATOS GENERALES/PREDIO”.
- No mostrar versiones v7/v8/v9/v10 en encabezado.
- Modo claro/oscuro con solo ícono sol/luna.
- Botones claros para volver a inicio, volver a formulario, guardar, limpiar y generar.
- Reducir scroll al máximo mediante pantallas/módulos.

## Pendientes para Codex
1. Revisar que todos los botones de navegación funcionen en móvil y escritorio.
2. Validar que el formulario dinámico no muestre campos de documentos no seleccionados.
3. Validar que materiales/soportes/firmas/cargas no aparezcan dentro del formulario principal.
4. Revisar persistencia local y restauración de sesión.
5. Revisar ZIP final: debe llamarse solo con el nombre del solicitante.
6. Revisar generación real de PDF/ZIP contra la versión base original si se requiere reintegrar plantillas PDF embebidas.
7. Mejorar visual final hasta nivel GS Diagnósticos.

## Archivos
- index.html: app principal preliminar.
- manifest.json: configuración PWA.
- sw.js: service worker.
- icon-192.png / icon-512.png: íconos PWA.

