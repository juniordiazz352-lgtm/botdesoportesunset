/**
 * events/ready.js
 * Se ejecuta cuando el bot está online y listo.
 */

const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot iniciado como: ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '🎫 Sistema de Soporte', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
