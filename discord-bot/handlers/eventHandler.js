/**
 * handlers/eventHandler.js
 * Carga dinámicamente todos los eventos de la carpeta /events.
 */

const fs   = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  let count = 0;

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    count++;
  }

  console.log(`✅ ${count} eventos cargados.`);
}

module.exports = { loadEvents };
