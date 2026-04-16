const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // ====================================
        // COMANDOS CON PREFIJO !
        // ====================================

        // !say <texto>
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo después de !say');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        // !embed <título> | <descripción>
        if (message.content.startsWith('!embed')) {
            const content = message.content.slice(7).trim();
            const separatorIndex = content.indexOf('|');
            let title, description;
            if (separatorIndex === -1) {
                title = '📢 Anuncio';
                description = content;
            } else {
                title = content.slice(0, separatorIndex).trim();
                description = content.slice(separatorIndex + 1).trim();
            }
            const embed = new EmbedBuilder()
                .setTitle(title || '📢 Anuncio')
                .setDescription(description || 'Sin descripción')
                .setColor('#5865F2')
                .setFooter({ text: `Creado por ${message.author.tag}` })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        // !ping
        if (message.content === '!ping') {
            const ping = Math.round(message.client.ws.ping);
            await message.reply(`🏓 Pong! Latencia: ${ping}ms`);
            await message.delete().catch(() => {});
            return;
        }

        // !info
        if (message.content === '!info') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Información del Bot')
                .setDescription('Bot de soporte con formularios, bienvenidas y moderación')
                .setColor('#00ff00')
                .addFields(
                    { name: '📡 Ping', value: `${Math.round(message.client.ws.ping)}ms`, inline: true },
                    { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '📅 Uptime', value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true },
                    { name: '📚 Comandos', value: `${message.client.commands.size}`, inline: true }
                )
                .setFooter({ text: 'Bot de Soporte PRO' })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        // !purge <cantidad> (solo staff)
        if (message.content.startsWith('!purge')) {
            let config = {};
            if (fs.existsSync('./data/config.json')) {
                config = JSON.parse(fs.readFileSync('./data/config.json'));
            }
            const isStaff = message.member.roles.cache.has(config.rol_staff);
            if (!isStaff) {
                return message.reply('❌ No tienes permiso.').then(m => setTimeout(() => m.delete(), 3000));
            }
            const args = message.content.split(' ');
            let amount = parseInt(args[1]);
            if (isNaN(amount) || amount < 1) amount = 10;
            if (amount > 100) amount = 100;
            const fetched = await message.channel.messages.fetch({ limit: amount });
            await message.channel.bulkDelete(fetched, true);
            const msg = await message.channel.send(`🗑️ Se borraron ${fetched.size} mensajes.`);
            setTimeout(() => msg.delete(), 3000);
            await message.delete().catch(() => {});
            return;
        }
    }
};
