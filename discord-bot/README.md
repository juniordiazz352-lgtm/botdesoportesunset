# 🎫 Bot de Soporte Discord — Documentación Completa

Bot profesional de soporte con sistema de tickets, formularios interactivos, transcripciones HTML y más.

---

## 📋 Índice
1. [Requisitos](#requisitos)
2. [Instalación](#instalación)
3. [Configuración Inicial](#configuración-inicial)
4. [Comandos](#comandos)
5. [Flujo de Uso](#flujo-de-uso)
6. [Arquitectura del Proyecto](#arquitectura)
7. [Solución de Problemas](#solución-de-problemas)

---

## ✅ Requisitos

- **Node.js** v18 o superior
- **Git Bash** (Windows) o terminal de Linux/macOS
- Una aplicación de Discord creada en [discord.com/developers](https://discord.com/developers/applications)
- **Intents habilitados** en el portal de desarrolladores:
  - `PRESENCE INTENT`
  - `SERVER MEMBERS INTENT`
  - `MESSAGE CONTENT INTENT`

---

## 🚀 Instalación

### Paso 1 — Clonar/descargar el proyecto
```bash
# Si tienes Git:
git clone <url-del-repositorio>
cd discord-bot

# O simplemente entra a la carpeta si ya la descargaste:
cd discord-bot
```

### Paso 2 — Instalar dependencias
```bash
npm install
```

### Paso 3 — Configurar variables de entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

Abre `.env` con cualquier editor y rellena:
```env
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=id_de_tu_aplicacion
GUILD_ID=id_de_tu_servidor
```

**¿Dónde encuentro estos datos?**
- `DISCORD_TOKEN`: Portal de desarrolladores → Tu app → "Bot" → "Token" → Reset Token
- `CLIENT_ID`: Portal de desarrolladores → Tu app → "OAuth2" → "Client ID"  
- `GUILD_ID`: Discord → clic derecho en tu servidor → "Copiar ID del servidor"

### Paso 4 — Registrar los Slash Commands
```bash
npm run deploy
```
Deberías ver: `✅ Comandos registrados correctamente.`

> ⚠️ Los comandos de guild tardan **segundos** en aparecer. Los globales tardan hasta 1 hora.

### Paso 5 — Iniciar el bot
```bash
npm start

# Para desarrollo con auto-reinicio:
npm run dev
```

---

## ⚙️ Configuración Inicial

Una vez el bot esté online, el **primer comando** que debes usar es `/setup`:

```
/setup canal_logs:#logs rol_staff:@Staff categoria_tickets:1234567890
```

**Parámetros:**
| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `canal_logs` | Canal donde se guardan transcripciones y logs | `#logs-tickets` |
| `rol_staff` | Rol que puede gestionar tickets | `@Staff` |
| `categoria_tickets` | **ID** de la categoría de Discord | `1234567890` |
| `canal_formularios` | Canal de respuestas de formularios (opcional) | `#formularios` |

**¿Cómo obtener el ID de una categoría?**
1. Activa el Modo Desarrollador: Configuración → Avanzado → Modo Desarrollador ✅
2. Clic derecho en la categoría → "Copiar ID de canal"

---

## 📌 Comandos

### 🛠️ Administración

| Comando | Descripción |
|---------|-------------|
| `/setup` | Configura el bot (logs, staff, categoría) |
| `/stats` | Estadísticas del sistema de soporte |

### 🎫 Tickets

| Comando | Descripción |
|---------|-------------|
| `/crear-panel-ticket` | Crea un panel con botones de categorías de ticket |
| `/ticket agregar @usuario` | Agrega un usuario al ticket actual |
| `/ticket quitar @usuario` | Quita un usuario del ticket actual |
| `/ticket renombrar nombre` | Renombra el canal del ticket |

### 📋 Formularios

| Comando | Descripción |
|---------|-------------|
| `/crear-form` | Asistente por DM para crear un formulario |
| `/crear-panel-form` | Crea un panel con menú desplegable de formularios |
| `/listar-forms` | Lista todos los formularios y sus IDs |
| `/eliminar-form` | Elimina un formulario por ID |

### 💬 Utilidades (prefijo `!`)

| Comando | Descripción |
|---------|-------------|
| `!say` | El bot te pregunta por DM qué decir y lo envía al canal |
| `!embed` | El bot te pregunta título y descripción por DM y envía un embed de anuncio |

---

## 🔄 Flujo de Uso

### Flujo de Tickets
```
Usuario ve el panel → Clic en categoría (ej: "Soporte")
  → Modal aparece: describe tu consulta + prioridad
    → Bot crea canal privado: ticket-soporte-0001
      → Embed de bienvenida con botones [Reclamar][En Espera][Transcripción][Cerrar]
        → Staff reclama: canal → reclamado-juan
          → Staff cierra: transcripción HTML → logs + DM de valoración al usuario
```

### Flujo de Formularios
```
Admin: /crear-form → configura por DM (título, preguntas, canales)
Admin: /crear-panel-form → panel con menú desplegable

Usuario ve el panel → Selecciona formulario del menú
  → Bot envía preguntas por DM una a una (3 min c/u)
    → Respuestas van al canal de revisión con botones [Aprobar][Rechazar]
      → Si Aprobar: va al canal de aprobados + notificación al usuario
      → Si Rechazar: modal de razón → canal de rechazados + notificación al usuario
```

### Anti-Spam
- Un usuario no puede tener **2 tickets abiertos** simultáneamente
- Si intenta crear **3 tickets seguidos** en 5 minutos → bloqueado temporalmente

---

## 🏗️ Arquitectura del Proyecto

```
discord-bot/
├── index.js                    # Entry point
├── deploy-commands.js          # Registra slash commands
├── package.json
├── .env                        # Variables de entorno (NO subir a git)
│
├── commands/                   # Comandos organizados por módulo
│   ├── admin/
│   │   └── setup.js            # /setup
│   ├── tickets/
│   │   ├── panel-ticket.js     # /crear-panel-ticket
│   │   └── ticket-manage.js    # /ticket agregar|quitar|renombrar
│   ├── forms/
│   │   ├── crear-form.js       # /crear-form
│   │   ├── crear-panel-form.js # /crear-panel-form
│   │   ├── eliminar-form.js    # /eliminar-form
│   │   └── list-forms.js       # /listar-forms
│   └── utility/
│       └── stats.js            # /stats
│
├── events/                     # Eventos de Discord
│   ├── ready.js                # Bot online
│   ├── messageCreate.js        # !say y !embed
│   └── interactionCreate.js    # Router de interacciones
│
├── interactions/               # Lógica de interacciones
│   ├── slashCommand.js         # Despachador de slash commands
│   ├── buttonHandler.js        # Todos los botones
│   ├── modalHandler.js         # Todos los modals
│   └── selectMenuHandler.js    # Menús desplegables
│
├── handlers/                   # Cargadores automáticos
│   ├── commandHandler.js       # Carga comandos dinámicamente
│   └── eventHandler.js         # Carga eventos dinámicamente
│
├── utils/                      # Utilidades compartidas
│   ├── dataManager.js          # Gestión de archivos JSON
│   └── ticketUtils.js          # Helpers de tickets
│
└── data/                       # Persistencia (auto-generado)
    ├── config.json             # Configuración del servidor
    ├── data.json               # Tickets, paneles, ratings
    └── forms.json              # Formularios creados
```

---

## ❓ Solución de Problemas

### "El bot no responde a los slash commands"
- Ejecuta `npm run deploy` y espera unos segundos
- Verifica que el bot tenga el scope `applications.commands` en OAuth2

### "Error: Missing Permissions"
- El bot necesita ser el rol más alto posible, o al menos:
  - Gestionar Canales, Ver Canales, Enviar Mensajes, Gestionar Mensajes, Leer Historial

### "No aparece la categoría de tickets"
- Asegúrate de copiar el **ID de la categoría**, no del canal
- El ID se copia con clic derecho → Copiar ID (requiere Modo Desarrollador activado)

### "El DM del formulario no llega"
- El usuario debe tener activado: **Configuración → Privacidad → Mensajes directos de miembros del servidor** ✅

### Los archivos `data/` no existen
- Se crean automáticamente al iniciar el bot por primera vez. No los edites manualmente a menos que sepas lo que haces.

---

## 🔒 Seguridad

- Nunca subas tu archivo `.env` a GitHub. El `.gitignore` ya lo excluye.
- Rota tu token regularmente desde el portal de desarrolladores.
- El archivo `.env.example` es seguro de subir (no tiene datos reales).

---

*Bot desarrollado con Discord.js v14 • Node.js 18+*
