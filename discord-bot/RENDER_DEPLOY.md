# 🚀 Guía de Deploy en Render.com (Plan GRATIS)

> ⚠️ **Limitación del plan gratis de Render:**  
> Los Web Services gratuitos se "duermen" tras 15 minutos sin tráfico HTTP.  
> El bot ya incluye un servidor HTTP interno para evitar esto, pero Render igual  
> puede reiniciarlo esporádicamente. Para 24/7 real necesitás el plan $7/mes.  
> **Para un bot de prueba o comunidad pequeña, el plan gratis funciona bien.**

---

## 📋 Pre-requisitos

1. Cuenta en [render.com](https://render.com) (gratis, con GitHub)
2. Cuenta en [github.com](https://github.com) con tu código subido
3. Token del bot de Discord listo

---

## 🐙 Paso 1 — Subir el código a GitHub

Abrí **Git Bash** en la carpeta `discord-bot/` y ejecutá:

```bash
git init
git add .
git commit -m "Initial commit - Discord Support Bot"
```

Luego andá a [github.com/new](https://github.com/new) y creá un repositorio **privado** llamado `discord-bot`.

Copiá los comandos que GitHub te da, que van a ser algo así:

```bash
git remote add origin https://github.com/TU_USUARIO/discord-bot.git
git branch -M main
git push -u origin main
```

Verificá que en GitHub aparezcan todos los archivos antes de continuar.

---

## 🌐 Paso 2 — Crear el servicio en Render

1. Andá a [dashboard.render.com](https://dashboard.render.com)
2. Hacé clic en **"New +"** → **"Web Service"**
3. Conectá tu cuenta de GitHub si no lo hiciste aún
4. Buscá y seleccioná el repositorio `discord-bot`
5. Completá el formulario:

| Campo | Valor |
|-------|-------|
| **Name** | `discord-support-bot` (o el nombre que quieras) |
| **Region** | `Oregon (US West)` — la más rápida para Discord |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |
| **Plan** | `Free` ✅ |

6. **NO hagas clic en "Create Web Service" todavía** — primero agregá las variables de entorno.

---

## 🔑 Paso 3 — Variables de entorno

Bajá hasta la sección **"Environment Variables"** y agregá estas 3:

| Key | Value |
|-----|-------|
| `DISCORD_TOKEN` | `Tu token del bot (el que empieza con MTk...)` |
| `CLIENT_ID` | `ID numérico de tu aplicación` |
| `GUILD_ID` | `ID de tu servidor de Discord` |

> **¿Dónde consigo el TOKEN?**  
> [discord.com/developers](https://discord.com/developers/applications) → Tu app → Bot → Reset Token

> **¿Dónde consigo el CLIENT_ID?**  
> [discord.com/developers](https://discord.com/developers/applications) → Tu app → OAuth2 → Client ID

> **¿Dónde consigo el GUILD_ID?**  
> Discord → Modo Desarrollador activado → Clic derecho en tu servidor → "Copiar ID del servidor"

---

## ✅ Paso 4 — Crear el servicio

Ahora sí hacé clic en **"Create Web Service"**.

Render va a:
1. Clonar tu repositorio
2. Ejecutar `npm install`
3. Ejecutar `node index.js`
4. Darte una URL pública tipo `https://discord-support-bot.onrender.com`

Mirá los **logs en tiempo real** en la pestaña "Logs". Deberías ver:

```
🌐 Servidor HTTP escuchando en puerto 10000
✅ Datos inicializados correctamente.
✅ X comandos cargados.
✅ X eventos cargados.
✅ Bot iniciado como: NombreDelBot#1234
```

---

## 🔄 Paso 5 — Registrar los Slash Commands

Los slash commands se tienen que registrar **una sola vez** desde tu PC local.

En Git Bash, en la carpeta del proyecto:

```bash
# Primero crea el .env local con tus datos:
cp .env.example .env
# Editá .env con tu token, client ID y guild ID

# Luego instalá dependencias si no lo hiciste:
npm install

# Registrá los comandos:
npm run deploy
```

Deberías ver: `✅ Comandos registrados correctamente.`

Los comandos aparecen en Discord en **segundos** (son de guild, no globales).

---

## 🛡️ Paso 6 — Mantener el bot despierto (opcional pero recomendado)

El plan gratis de Render duerme el servicio tras 15 minutos sin requests HTTP.  
Para evitarlo, usá un servicio externo que haga ping cada 10 minutos:

### Opción A — UptimeRobot (gratis)
1. Creá cuenta en [uptimerobot.com](https://uptimerobot.com)
2. "New Monitor" → **HTTP(s)**
3. URL: `https://discord-support-bot.onrender.com/health`
4. Intervalo: **10 minutos**
5. Guardá

El endpoint `/health` ya está incluido en el bot y responde con `{"status":"ok"}`.

### Opción B — Cron-job.org (gratis)
1. Creá cuenta en [cron-job.org](https://cron-job.org)
2. Creá un job con URL: `https://discord-support-bot.onrender.com/health`
3. Intervalo: cada 10 minutos

---

## 🔄 Actualizar el bot

Cada vez que hagas cambios al código:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Render detecta el push automáticamente y hace un **redeploy** solo. No tenés que hacer nada más.

---

## ❌ Problemas comunes en Render

### "Build failed" / "npm install failed"
- Verificá que el `package.json` esté en la raíz (no dentro de otra carpeta)
- Render necesita Node 18+, ya está configurado en `package.json`

### El bot aparece online pero los comandos no funcionan
- Ejecutá `npm run deploy` desde tu PC local
- Verificá que `CLIENT_ID` y `GUILD_ID` en Render sean correctos

### "Error: Used disallowed intents"
- Andá al portal de Discord Developers → Tu app → Bot
- Activá los 3 Privileged Gateway Intents:
  - ✅ PRESENCE INTENT
  - ✅ SERVER MEMBERS INTENT  
  - ✅ MESSAGE CONTENT INTENT

### Los datos (tickets/formularios) se borran al reiniciar
- Esto es normal en el plan gratis: el sistema de archivos de Render es **efímero**
- Los archivos `data/*.json` se resetean en cada deploy
- Solución gratuita: usar [MongoDB Atlas](https://www.mongodb.com/atlas) (gratis) para persistencia real
- Por ahora, el bot funciona igual, solo pierde el historial entre deploys

---

## 📊 Resumen del plan gratis de Render

| Característica | Plan Gratis |
|---------------|-------------|
| Horas/mes | 750 horas (suficiente para 1 servicio 24/7) |
| RAM | 512 MB |
| CPU | Compartida |
| Ancho de banda | 100 GB/mes |
| Sleep tras inactividad | 15 min (evitado con UptimeRobot) |
| Dominio personalizado | ❌ |
| Almacenamiento persistente | ❌ (se resetea en deploy) |
| **Costo** | **$0** ✅ |

---

*Render.com • Discord.js v14 • Node.js 18*
