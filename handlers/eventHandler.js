const fs = require('fs');
module.exports.loadEvents = async (client) => {
    const files = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
    let count = 0;
    for (const file of files) {
        try {
            const event = require(`../events/${file}`);
            if (event.name) {
                client.on(event.name, (...args) => event.execute(...args, client));
                count++;
                console.log(`✅ Evento cargado: ${event.name}`);
            }
        } catch(e) {
            console.error(`❌ Error en evento ${file}:`, e.message);
        }
    }
    console.log(`✅ ${count} eventos cargados`);
};
