const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // ============================================
        // !say
        // ============================================
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo después de !say');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !embed
        // ============================================
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

        // ============================================
        // !ping
        // ============================================
        if (message.content === '!ping') {
            const ping = Math.round(message.client.ws.ping);
            await message.reply(`🏓 Pong! Latencia: ${ping}ms`);
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !info
        // ============================================
        if (message.content === '!info') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Información del Bot')
                .setDescription('Bot de soporte profesional con sistema de tickets')
                .setColor('#00ff00')
                .addFields(
                    { name: '📡 Ping', value: `${Math.round(message.client.ws.ping)}ms`, inline: true },
                    { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '📅 Uptime', value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true }
                )
                .setFooter({ text: 'Bot de Soporte PRO' })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !tickets
        // ============================================
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

        // Puedes agregar aquí más comandos (ej. !adduser, !removeuser, etc.)
    }
};

// !verify
if (message.content === '!verify') {
    // Reutilizar la misma lógica que /verify pero sin responder con ephemeral
    const crypto = require('crypto');
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const dmEmbed = new EmbedBuilder()
        .setTitle('🔐 Verificación de Roblox')
        .setDescription(`**Instrucciones:**\n1. Cambia tu descripción de perfil de Roblox a:\`${code}\`\n2. Luego responde a este mensaje con tu nombre de usuario de Roblox.\n\n⚠️ El código expira en 10 minutos.`)
        .setColor('#5865F2');
    await message.author.send({ embeds: [dmEmbed] }).catch(() => {
        return message.reply('❌ No puedo enviarte DM. Habilita tus mensajes directos.');
    });
    if (!global.verifyCodes) global.verifyCodes = new Map();
    global.verifyCodes.set(message.author.id, { code, expires: Date.now() + 600000, guildId: message.guild.id });
    const filter = m => m.author.id === message.author.id;
    const collector = message.author.dmChannel?.createMessageCollector({ filter, time: 600000, max: 1 });
    if (!collector) return;
    collector.on('collect', async (msg) => {
        const robloxUser = msg.content.trim();
        const data = global.verifyCodes.get(message.author.id);
        if (!data || Date.now() > data.expires) {
            await message.author.send('❌ El código ha expirado. Usa !verify nuevamente.');
            return;
        }
        // Simular verificación exitosa
        const { Verification } = require('../utils/database');
        await Verification.findOneAndUpdate(
            { userId: message.author.id, guildId: message.guild.id },
            { robloxUser, code: data.code, verified: true, verifiedAt: new Date() },
            { upsert: true }
        );
        const member = message.guild.members.cache.get(message.author.id);
        const newNickname = `${member.user.username} (@${robloxUser})`;
        await member.setNickname(newNickname).catch(e => console.error(e));
        await message.author.send(`✅ ¡Verificado! Tu apodo ha sido cambiado a \`${newNickname}\`.`);
        global.verifyCodes.delete(message.author.id);
    });
    await message.delete().catch(() => {});
    return;
}
