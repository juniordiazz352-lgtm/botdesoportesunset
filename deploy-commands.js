require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const folders = fs.readdirSync('./commands');

for (const folder of folders) {
    const files = fs.readdirSync(`./commands/${folder}`).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const command = require(`./commands/${folder}/${file}`);
            if (command.data) {
                commands.push(command.data.toJSON());
                console.log(`✅ Comando preparado: ${command.data.name}`);
            }
        } catch(e) {
            console.error(`❌ Error en ${file}:`, e.message);
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Registrando ${commands.length} comandos...`);
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        
        console.log(`✅ ${commands.length} comandos registrados correctamente`);
    } catch(e) {
        console.error('❌ Error registrando comandos:', e);
    }
})();
