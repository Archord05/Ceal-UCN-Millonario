# Quien Quiere Ser Millonario - Web App

Una réplica interactiva del clásico juego de televisión, construida con una arquitectura de backend en Python y una interfaz web dinámica y responsiva. El sistema de preguntas es totalmente personalizable mediante un archivo Excel.

## Características Principales

- **Preguntas Dinámicas desde Excel:** Es posible modificar, agregar o eliminar preguntas editando un archivo `.xlsx`.
- **Dificultad Progresiva:** El juego selecciona 15 preguntas aleatorias por partida divididas en 3 niveles de dificultad (Fácil, Medio y Difícil).
- **Sin Repeticiones:** El sistema memoriza las preguntas ya jugadas durante la sesión en curso para evitar repeticiones hasta que se agote la base de datos.
- **Comodines Clásicos:**
  - **50:50:** Elimina visualmente dos opciones incorrectas.
  - **Llamada Telefónica:** Un amigo simulado ofrece su opinión con un nivel de certeza que varía según la dificultad de la pregunta.
  - **Consultar al Público:** Gráfico de barras animado con los resultados simulados de la votación del público.
- **Hitos de Seguridad:** Premios asegurados al superar la pregunta 5 y la pregunta 10.
- **Atajos de Teclado:** El jugador puede interactuar utilizando las teclas `A`, `B`, `C`, `D` y `Enter`.

## Stack Tecnológico

**Backend:**
- **[Python](https://www.python.org/)** - Lógica central del servidor.
- **[Flask](https://flask.palletsprojects.com/)** - Framework web ligero utilizado para crear la API y servir las vistas de la aplicación.
- **[OpenPyXL](https://openpyxl.readthedocs.io/)** - Biblioteca para la lectura y generación del archivo de base de datos en Excel.
- **[Python-dotenv](https://pypi.org/project/python-dotenv/)** - Gestión limpia de variables de entorno (puertos, modos de desarrollo).

**Frontend:**
- **HTML5 & CSS3:** Diseño responsivo adaptado para simular un ambiente televisivo, con temática oscura, animaciones de entrada fluidas (fade-ins) y uso de variables CSS para el esquema de colores.
- **Vanilla JavaScript:** Toda la lógica del cliente (selección, validación, comodines, temporizadores de los modales y consumo de la API RESTful mediante `fetch`) implementada sin dependencias de librerías externas pesadas.
- **SVGs:** Iconografía vectorial implementada en línea para mantener la ligereza y escalabilidad visual de la interfaz.

## Requisitos e Instalación

1. Se requiere tener **Python** instalado en el sistema.
2. Clonar o descargar la carpeta de este proyecto.
3. Abrir una terminal (Símbolo del sistema o PowerShell) en el directorio raíz del proyecto.
4. Instalar las librerías necesarias ejecutando el siguiente comando:
   ```bash
   pip install -r requirements.txt
   ```
5. (Opcional) Para cambiar el puerto de ejecución u otros ajustes, se debe crear un archivo `.env` tomando como base la plantilla `.env.example`.

## Inicio del Proyecto

Para iniciar el servidor local, se debe ejecutar el archivo principal desde la terminal, asegurándose de estar ubicado en la carpeta del proyecto:

```bash
python app.py
```

- Si es la primera ejecución, el sistema creará automáticamente un archivo de ejemplo llamado `preguntas.xlsx` con 30 preguntas iniciales.
- Se mostrará un mensaje en la terminal indicando que el servidor se encuentra activo.
- Finalmente, se debe acceder a la siguiente dirección a través de cualquier navegador web:
  http://localhost:5000

## Guía de Utilización: Agregar preguntas personalizadas
1. Incluir la dirección del archivo .xlsx en el .env, para la extracción de preguntas
2. Caso contrario, abrir el archivo **`preguntas.xlsx`** utilizando Microsoft Excel, Google Sheets o un editor de hojas de cálculo compatible.
3. El archivo consta de una tabla con las siguientes columnas:
   - `Pregunta`: El enunciado principal.
   - `Opcion_A` hasta `Opcion_D`: Las cuatro alternativas de respuesta.
   - `Respuesta_Correcta`: Exclusivamente la letra de la opción correcta (`A`, `B`, `C` o `D`).
   - `Dificultad`: El nivel de la pregunta (`1` = Fácil, `2` = Medio, `3` = Difícil).
4. Las nuevas preguntas se pueden incorporar añadiendo filas en la parte inferior, asegurándose de no dejar filas en blanco de por medio.
5. Guardar los cambios en el archivo Excel.
6. Al iniciar nuevamente el servidor, el juego cargará automáticamente el nuevo set de preguntas.
7. En caso de que las preguntas no se actualizen, eliminar "preguntas.json" e iniciar nuevamente el programa

## Reinicio de Sesión
El sistema lleva un registro interno de las preguntas que ya han sido seleccionadas para evitar repeticiones. Si el administrador desea reiniciar este historial y disponer nuevamente de toda la base de preguntas, simplemente debe detener el proceso del servidor de Python (presionando `Ctrl + C` en la terminal) y volver a ejecutarlo.
