const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // ====================================
        // !say
        // ====================================
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo después de !say');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        // ====================================
        // !embed
        // ====================================
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

        // ====================================
        // !ping
        // ====================================
        if (message.content === '!ping') {
            const ping = Math.round(message.client.ws.ping);
            await message.reply(`🏓 Pong! Latencia: ${ping}ms`);
            await message.delete().catch(() => {});
            return;
        }

        // ====================================
        // !info
        // ====================================
        if (message.content === '!info') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Información del Bot')
                .setDescription('Bot de soporte profesional con sistema de tickets, verificación Roblox y bienvenidas')
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

        // ====================================
        // !tickets
        // ====================================
        if (message.content === '!tickets') {
            const ticketsPath = './data/tickets.json';
            if (fs.existsSync(ticketsPath)) {
                const tickets = JSON.parse(fs.readFileSync(ticketsPath));
                const userTickets = Object.values(tickets).filter(t => t.userId === message.author.id && t.status !== 'closed');
                if (userTickets.length === 0) {
                    await message.reply('📭 No tienes tickets abiertos');
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('🎫 Tus Tickets Abiertos')
                        .setColor('#5865F2');
                    userTickets.forEach(t => {
                        embed.addFields({ name: t.category || 'Ticket', value: `ID: ${t.id}\nCanal: <#${t.channelId}>`, inline: true });
                    });
                    await message.channel.send({ embeds: [embed] });
                }
            } else {
                await message.reply('📭 No hay tickets registrados');
            }
            await message.delete().catch(() => {});
            return;
        }

        // ====================================
        // !verify (alternativa al slash)
        // ====================================
        if (message.content === '!verify') {
            // Aquí llamas al mismo sistema de verificación que el slash
            const command = message.client.commands.get('verify');
            if (command) {
                // Simular una interacción (esto es básico; idealmente deberías reutilizar la lógica)
                await message.reply('✅ Revisa tus mensajes directos para verificar tu cuenta de Roblox.');
                // Llamar a la función de verificación enviando DM
                const user = message.author;
                const dmChannel = await user.createDM();
                const verifyModule = require('../commands/moderation/verify');
                if (verifyModule.sendVerificationDM) {
                    await verifyModule.sendVerificationDM(user, dmChannel);
                }
            } else {
                await message.reply('❌ El comando /verify no está disponible.');
            }
            await message.delete().catch(() => {});
            return;
        }
    }
};
