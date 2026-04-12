const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { getOrCreateCode, markVerified, verifyCode } = require('../utils/robloxVerify');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // ========== COMANDOS CON PREFIJO ! ==========
        // !say
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo después de !say');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        // !embed
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
                .setDescription('Bot de soporte profesional con tickets, verificación Roblox y bienvenidas')
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

        // !tickets
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

        // !purge (solo staff)
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

        // !verify
        if (message.content === '!verify') {
            const code = getOrCreateCode(message.author.id);
            const embed = new EmbedBuilder()
                .setTitle('🔐 Verificación Roblox')
                .setDescription(`**Tu código único:** \`${code}\`\n\n📝 **Instrucciones:**\n1. Copia este código.\n2. Ve a tu perfil de Roblox y pégalo en tu **descripción**.\n3. Luego **responde a este mensaje** con tu nombre de usuario de Roblox.\n\n⏰ **Tienes 10 minutos** para completar el proceso. Si expira, deberás usar !verify nuevamente.`)
                .setColor('#00ff00');
            try {
                const dm = await message.author.createDM();
                await dm.send({ embeds: [embed] });
                await message.reply('✅ Revisa tus mensajes directos.');
            } catch (err) {
                console.error(err);
                await message.reply('❌ No pude enviarte DM. Habilita los mensajes directos.');
            }
            await message.delete().catch(() => {});
            return;
        }

        // ========== PROCESAR RESPUESTA EN DM (VERIFICACIÓN) ==========
        if (message.channel.type === 1 && !message.author.bot) {
            const codes = require('../utils/robloxVerify').loadCodes?.() || {};
            const userData = codes[message.author.id];
            if (!userData || userData.verified) return;

            // Verificar expiración
            if ((Date.now() - userData.createdAt) > 10 * 60 * 1000) {
                await message.reply('❌ Tu código ha expirado. Por favor, ejecuta `!verify` nuevamente.');
                return;
            }

            const robloxUsername = message.content.trim();
            if (!robloxUsername) return;

            const isValid = await verifyCode(robloxUsername, userData.code);
            if (isValid) {
                markVerified(message.author.id, robloxUsername);
                const guild = message.client.guilds.cache.first();
                const member = guild?.members.cache.get(message.author.id);
                if (member) {
                    // Cambiar apodo
                    const newNickname = `${member.user.username} (@${robloxUsername})`;
                    await member.setNickname(newNickname).catch(() => {});

                    // Cargar configuración de roles
                    let config = {};
                    if (fs.existsSync('./data/config.json')) {
                        config = JSON.parse(fs.readFileSync('./data/config.json'));
                    }
                    // Quitar rol "no verificado" si existe
                    if (config.verify && config.verify.noVerificado) {
                        const role = guild.roles.cache.get(config.verify.noVerificado);
                        if (role) await member.roles.remove(role).catch(() => {});
                    }
                    // Asignar rol "verificado" si existe
                    if (config.verify && config.verify.verificado) {
                        const role = guild.roles.cache.get(config.verify.verificado);
                        if (role) await member.roles.add(role).catch(() => {});
                    }
                }
                await message.reply('✅ ¡Verificación exitosa! Tu apodo ha sido actualizado y se han ajustado tus roles.');
            } else {
                await message.reply('❌ No encontré el código en tu descripción de Roblox. Asegúrate de haberlo puesto correctamente y vuelve a enviar tu usuario.');
            }
        }
    }
};
