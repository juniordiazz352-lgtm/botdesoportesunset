const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // !say
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        // !embed
        if (message.content.startsWith('!embed')) {
            const content = message.content.slice(7).trim();
            const sep = content.indexOf('|');
            let title = sep === -1 ? '📢 Anuncio' : content.slice(0, sep).trim();
            let desc = sep === -1 ? content : content.slice(sep + 1).trim();
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(desc)
                .setColor('#5865F2')
                .setFooter({ text: `Creado por ${message.author.tag}` })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        // !ping
        if (message.content === '!ping') {
            await message.reply(`🏓 Pong! ${Math.round(message.client.ws.ping)}ms`);
            await message.delete().catch(() => {});
            return;
        }

        // !info
        if (message.content === '!info') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Información del Bot')
                .setDescription('Bot de soporte con verificación Roblox, formularios, bienvenidas y moderación')
                .setColor('#00ff00')
                .addFields(
                    { name: '📡 Ping', value: `${Math.round(message.client.ws.ping)}ms`, inline: true },
                    { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '📅 Uptime', value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true },
                    { name: '📚 Comandos', value: `${message.client.commands.size}`, inline: true }
                )
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
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

        // !verify (alternativa a /verify)
        if (message.content === '!verify') {
            const { getOrCreateCode } = require('../utils/robloxVerify');
            const code = getOrCreateCode(message.author.id);
            const embed = new EmbedBuilder()
                .setTitle('🔐 Verificación Roblox')
                .setDescription(`**Tu código:** \`${code}\`\n\nPonlo en tu descripción de Roblox y luego **responde a este mensaje** con tu usuario.\n⏰ Tienes 10 minutos.`)
                .setColor('#00ff00');
            try {
                const dm = await message.author.createDM();
                await dm.send({ embeds: [embed] });
                await message.reply('✅ Revisa tus mensajes directos.');
            } catch (err) {
                await message.reply('❌ No pude enviarte DM. Habilita los mensajes directos.');
            }
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // PROCESAR RESPUESTA DE VERIFICACIÓN (DM)
        // ============================================
        if (message.channel.type === 1 && !message.author.bot) {
            const { loadCodes, markVerified, verifyCode } = require('../utils/robloxVerify');
            const codes = loadCodes();
            const userData = codes[message.author.id];
            if (!userData || userData.verified) return;

            if (Date.now() - userData.createdAt > 10 * 60 * 1000) {
                await message.reply('❌ Código expirado. Ejecuta `!verify` de nuevo.');
                return;
            }

            const robloxUser = message.content.trim();
            if (!robloxUser) return;

            const isValid = await verifyCode(robloxUser, userData.code);
            if (isValid) {
                markVerified(message.author.id, robloxUser);
                const guild = message.client.guilds.cache.first();
                const member = guild?.members.cache.get(message.author.id);
                if (member) {
                    await member.setNickname(`${member.user.username} (@${robloxUser})`).catch(() => {});
                    let config = {};
                    if (fs.existsSync('./data/config.json')) config = JSON.parse(fs.readFileSync('./data/config.json'));
                    if (config.verify?.noVerificado) {
                        const role = guild.roles.cache.get(config.verify.noVerificado);
                        if (role) await member.roles.remove(role);
                    }
                    if (config.verify?.verificado) {
                        const role = guild.roles.cache.get(config.verify.verificado);
                        if (role) await member.roles.add(role);
                    }
                }
                await message.reply('✅ ¡Verificación exitosa! Apodo actualizado y roles asignados.');
            } else {
                await message.reply('❌ Código no encontrado en tu descripción de Roblox. Revisa y vuelve a enviar tu usuario.');
            }
        }
    }
};
