const fs = require('fs');
const path = require('path');

module.exports.loadCommands = async (client) => {
    const folders = fs.readdirSync('./commands');
    let count = 0;
    
    for (const folder of folders) {
        const files = fs.readdirSync(`./commands/${folder}`).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const command = require(`../commands/${folder}/${file}`);
                if (command.data && command.data.name) {
                    client.commands.set(command.data.name, command);
                    count++;
                    console.log(`✅ Comando cargado: ${command.data.name}`);
                }
            } catch(e) {
                console.error(`❌ Error en ${file}:`, e.message);
            }
        }
    }
    console.log(`✅ ${count} comandos cargados`);
};
