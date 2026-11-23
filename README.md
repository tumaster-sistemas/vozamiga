# VozAmiga — Equipo IncluyeVES

**Equipo 21 · HackODS UA 2026 · ODS 10: Reducción de las desigualdades**

VozAmiga es un asistente web por voz que busca facilitar el acceso a información y orientación a adultos mayores y personas con discapacidad. Su interfaz prioriza acciones sencillas: hablar, escuchar una respuesta, acceder al módulo de emergencia y solicitar la lectura en voz alta de un texto.

> **Propósito:** reducir barreras de uso digital para que más personas puedan acceder a información y orientación sin tener que dominar un teléfono inteligente.

## Accesos rápidos

- **Demo:** https://tumaster-sistemas.github.io/vozamiga/
- **Repositorio:** https://github.com/tumaster-sistemas/vozamiga
- **Código QR:** `qr-vozamiga.png` (escanea para abrir la demo).

## Problema que abordamos

Para algunas personas, una tarea digital cotidiana puede convertirse en una barrera: leer instrucciones extensas, escribir en un teclado, navegar por varias pantallas o encontrar información útil en una situación urgente.

VozAmiga propone una interfaz de voz y controles visibles para facilitar una primera orientación. El proyecto se alinea principalmente con el **ODS 10: Reducción de las desigualdades**, mediante una propuesta de inclusión y accesibilidad digital.

## Funcionalidades

- **HABLAR:** permite formular consultas mediante la voz, cuando el navegador y el dispositivo son compatibles.
- **Respuestas en voz alta:** utiliza la síntesis de voz disponible en el navegador para escuchar la respuesta.
- **EMERGENCIA:** presenta accesos rápidos a números de ayuda configurados en la interfaz.
- **LÉEME ESTO:** permite introducir o pegar un texto y escucharlo en voz alta.
- **Orientación local programada:** incluye respuestas predefinidas para algunas consultas frecuentes.
- **Asistencia con IA opcional:** contempla Gemini y un servicio alternativo para consultas generales.

> **Importante:** VozAmiga es un prototipo de orientación y accesibilidad, no reemplaza a los servicios de emergencia, asesoría legal ni atención médica. La IA puede equivocarse. Ante información crítica, verifica siempre con la entidad oficial correspondiente.

## Cómo funciona

1. La persona abre VozAmiga desde un navegador moderno.
2. Toca el botón **HABLAR** y formula una consulta.
3. El navegador convierte la voz en texto, si ofrece reconocimiento de voz compatible.
4. La aplicación busca una respuesta programada o utiliza el servicio de IA configurado.
5. La respuesta se muestra y puede escucharse mediante síntesis de voz.

## Arquitectura y stack

VozAmiga es una aplicación web estática de frontend. **No se presenta como un backend propio**: la interfaz y la lógica del cliente se ejecutan en el navegador. Cuando se habilita la asistencia de IA, `app.js` realiza solicitudes a servicios externos; por ello, esas consultas requieren conexión a internet.

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Estructura | HTML5 | Vistas, controles y contenido |
| Presentación | CSS3 | Diseño adaptable, contraste y tamaños de controles |
| Lógica | JavaScript | Eventos, navegación, respuestas y coordinación de funciones |
| Voz a texto | Web Speech API (`SpeechRecognition`) | Reconocimiento de voz, según compatibilidad del navegador |
| Texto a voz | Web Speech API (`speechSynthesis`) | Lectura en voz alta |
| IA principal opcional | Google Gemini API | Consultas generales cuando hay una clave válida |
| Servicio alternativo de IA | Pollinations API | Alternativa de consulta cuando está disponible |
| Publicación | GitHub Pages | Alojamiento de la demo web |

**Flujo resumido:**

```text
Persona
  │
  ├── Habla ──> Reconocimiento de voz del navegador
  │                         │
  │                         ▼
  │                  app.js (lógica)
  │                    /       \\
  │          Respuestas       Servicios IA
  │          programadas      externos (opcional)
  │                    \\       /
  │                     ▼
  └──────────────> Respuesta en pantalla
                           │
                           ▼
                    Lectura en voz alta
```

## Estructura del repositorio

```text
vozamiga/
├── index.html       # Estructura de la interfaz
├── styles.css       # Estilos y adaptación visual
├── app.js           # Lógica, voz, respuestas y servicios de IA
├── README.md        # Documentación del proyecto
└── qr-vozamiga.png  # Código QR de acceso a la demo (si se incorpora)
```

## Ejecución local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tumaster-sistemas/vozamiga.git
   cd vozamiga
   ```

2. Inicia un servidor estático local. Por ejemplo, con Node.js:

   ```bash
   npx serve .
   ```

3. Abre en el navegador la dirección local que indique el servidor.

También puedes utilizar la extensión Live Server de Visual Studio Code. Para probar reconocimiento de voz, utiliza un navegador compatible y concede permiso al micrófono cuando lo solicite.

## Configuración de IA y seguridad

- La clave de Gemini es **opcional** para el funcionamiento de las funciones programadas y de voz.
- No escribas claves API directamente en `index.html`, `app.js`, el README, capturas de pantalla ni commits.
- Si una clave se expuso accidentalmente, revócala y genera otra desde el proveedor.
- El prototipo puede guardar la clave opcional en el almacenamiento local del navegador. Esto es cómodo para una demostración, pero **no equivale a un sistema seguro de gestión de secretos**. No reutilices claves sensibles ni uses esta arquitectura como despliegue de producción.
- Las consultas enviadas a proveedores de IA salen del dispositivo y dependen de internet y de la disponibilidad del proveedor.
- No envíes datos personales, contraseñas, documentos de identidad ni información médica sensible a la IA.

## Accesibilidad y decisiones de diseño

- Acciones principales visibles y con etiquetas directas.
- Botones grandes para facilitar la interacción táctil.
- Respuestas que pueden leerse en pantalla y escucharse.
- Interacción por voz como alternativa a escribir.
- Lenguaje sencillo y orientación paso a paso.

La compatibilidad de reconocimiento y síntesis de voz puede variar según navegador, sistema operativo, idioma y dispositivo. Se recomienda probar la demo en el mismo celular y navegador que se utilizarán durante la presentación.

## Pruebas recomendadas para la demo

- [ ] Abrir la demo desde el QR en un celular.
- [ ] Verificar que la página cargue correctamente.
- [ ] Conceder permiso de micrófono y probar una consulta sencilla.
- [ ] Comprobar que la respuesta se muestra y se escucha.
- [ ] Abrir **LÉEME ESTO**, pegar un texto de prueba y reproducirlo.
- [ ] Abrir **EMERGENCIA** y comprobar que los accesos se muestran correctamente.
- [ ] Repetir la prueba sin configurar una clave de Gemini.
- [ ] Confirmar conexión a internet para las consultas que utilizan servicios externos.
- [ ] Verificar que no haya claves API ni datos personales en los archivos publicados.

## Tecnologías detectadas por GitHub

Según los porcentajes compartidos desde la pestaña Languages del repositorio:

- JavaScript: **53.8%**
- CSS: **25.1%**
- HTML: **21.1%**

Estos porcentajes describen la distribución de código detectada por GitHub y pueden cambiar cuando se actualiza el repositorio.

## Equipo IncluyeVES — Equipo 21

- **RODRÍGUEZ LA TORRE, Napoleón Jesús** — código, arquitectura y documentación.
- **SIMPERTIGUE YAURI, Frank Nilser** — pitch, pruebas y demos.
- **MILLONES RICO, Brando Andre** — pitch, pruebas y demos.

**Carrera:** Ingeniería de Sistemas  
**Institución:** Universidad Autónoma del Perú

## Alcance actual y siguientes mejoras

VozAmiga es un prototipo desarrollado para una demostración académica. Las siguientes mejoras requieren validación antes de considerarse implementadas:

- Validar la claridad de la interfaz con adultos mayores y personas con discapacidad.
- Revisar con fuentes oficiales los números, horarios y rutas de atención que se publiquen.
- Mejorar el manejo de errores cuando el navegador no admita reconocimiento de voz o se pierda la conexión.
- Añadir pruebas automatizadas y documentar sus resultados.
- Evaluar una arquitectura de servidor para proteger credenciales si el proyecto evoluciona a producción.

## Licencia

Proyecto académico del equipo IncluyeVES para HackODS UA 2026. No se concede una licencia de reutilización específica en este README; consultar con el equipo antes de reutilizar o redistribuir el código.
