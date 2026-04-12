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

        // ====================================
        // PROCESAR RESPUESTA DE VERIFICACIÓN (DM)
        // ====================================
        if (message.channel.type === 1) { // DM
            const { loadCodes, saveCodes, verifyCode } = require('../utils/robloxVerify');
            let codes = loadCodes();
            const userData = codes[message.author.id];
            if (!userData || userData.verified) return;

            const robloxUsername = message.content.trim();
            if (!robloxUsername) return;

            const isValid = await verifyCode(robloxUsername, userData.code);
            if (isValid) {
                userData.verified = true;
                userData.robloxUser = robloxUsername;
                saveCodes(codes);

                // Buscar el servidor (guild) donde el usuario necesita ser verificado
                // Asumimos que el bot está en un solo servidor principal; podrías configurarlo
                const guild = message.client.guilds.cache.first();
                if (guild) {
                    const member = guild.members.cache.get(message.author.id);
                    if (member) {
                        // Cambiar apodo a "nombre (@roblox)"
                        const newNickname = `${member.user.username} (@${robloxUsername})`;
                        await member.setNickname(newNickname).catch(() => {});
                        
                        // Opcional: dar rol de verificado
                        const config = JSON.parse(fs.readFileSync('./data/config.json'));
                        if (config.rol_verified) {
                            const role = guild.roles.cache.get(config.rol_verified);
                            if (role) await member.roles.add(role);
                        }
                    }
                }

                await message.reply('✅ ¡Verificación exitosa! Tu apodo ha sido actualizado.');
            } else {
                await message.reply('❌ No encontré el código en tu descripción de Roblox. Asegúrate de haberlo puesto correctamente y vuelve a enviar tu usuario.');
            }
        }
