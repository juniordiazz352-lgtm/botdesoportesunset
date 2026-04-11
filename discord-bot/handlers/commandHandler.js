/**
 * handlers/commandHandler.js
 * Carga dinámicamente todos los comandos de la carpeta /commands.
 */

const fs   = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath   = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);
  let count = 0;

  for (const folder of commandFolders) {
    const folderPath   = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command  = require(filePath);

      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        count++;
      } else {
        console.warn(`⚠️  Comando inválido en ${filePath} (falta data o execute)`);
      }
    }
  }

  console.log(`✅ ${count} comandos cargados.`);
}

module.exports = { loadCommands };
