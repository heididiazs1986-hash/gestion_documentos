# GS Documentos v77 - Inicio de jornada y catálogo de técnicos

- Nueva pantalla de inicio de jornada inspirada en AP Inventory, sin contraseña.
- El nombre del técnico/gestor pasa a lista cuando existe catálogo activo.
- Cédula y matrícula se completan automáticamente.
- RETIE toma nombre, cédula, matrícula y, si existen en el catálogo, profesión, consejo y lugar de expedición.
- E6 reutiliza el nombre del técnico seleccionado.
- Catálogo central en config/tecnicos.json.
- La app consulta la última lista al abrir y ofrece “Actualizar técnicos”.
- Si no hay conexión, utiliza la última lista guardada localmente.
- Los técnicos con activo=false no aparecen en la lista.
- Si el catálogo todavía está vacío, se conserva temporalmente el campo manual para no bloquear la operación.
