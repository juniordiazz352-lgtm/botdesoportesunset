const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { getOrCreateCode, markVerified, verifyCode, loadCodes } = require('../utils/robloxVerify');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // ====================================
        // COMANDOS CON PREFIJO ! (simplificados)
        // ====================================
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        if (message.content.startsWith('!embed')) {
            const content = message.content.slice(7).trim();
            const sep = content.indexOf('|');
            let title = sep === -1 ? '📢 Anuncio' : content.slice(0, sep).trim();
            let desc = sep === -1 ? content : content.slice(sep + 1).trim();
            const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor('#5865F2').setFooter({ text: `Creado por ${message.author.tag}` }).setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!ping') {
            await message.reply(`🏓 Pong! ${Math.round(message.client.ws.ping)}ms`);
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!info') {
            const embed = new EmbedBuilder().setTitle('🤖 Info').setDescription('Bot de soporte').setColor('#00ff00').addFields({ name: 'Ping', value: `${Math.round(message.client.ws.ping)}ms` });
            await message.channel.send({ embeds: [embed] });
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

        // ====================================
        // PROCESAR RESPUESTA EN DM (VERIFICACIÓN)
        // ====================================
        if (message.channel.type === 1 && !message.author.bot) {
            console.log(`[DM] Mensaje de ${message.author.tag}: ${message.content}`);
            const codes = loadCodes();
            const userData = codes[message.author.id];
            if (!userData) {
                console.log(`[DM] No hay datos de verificación para ${message.author.id}`);
                return;
            }
            if (userData.verified) {
                console.log(`[DM] Usuario ya verificado: ${message.author.id}`);
                return;
            }
            // Verificar expiración
            const now = Date.now();
            if ((now - userData.createdAt) > 10 * 60 * 1000) {
                await message.reply('❌ Tu código ha expirado. Por favor, ejecuta `!verify` nuevamente para obtener un código nuevo.');
                return;
            }
            const robloxUsername = message.content.trim();
            if (!robloxUsername) return;
            console.log(`[DM] Verificando código para ${robloxUsername}`);
            const isValid = await verifyCode(robloxUsername, userData.code);
            if (isValid) {
                markVerified(message.author.id, robloxUsername);
                // Cambiar apodo en el servidor
                const guild = message.client.guilds.cache.first();
                if (guild) {
                    const member = guild.members.cache.get(message.author.id);
                    if (member) {
                        const newNickname = `${member.user.username} (@${robloxUsername})`;
                        await member.setNickname(newNickname).catch(() => {});
                        // Roles de verificación
                        let config = {};
                        if (fs.existsSync('./data/config.json')) {
                            config = JSON.parse(fs.readFileSync('./data/config.json'));
                        }
                        if (config.verify && config.verify.noVerificado) {
                            const role = guild.roles.cache.get(config.verify.noVerificado);
                            if (role) await member.roles.remove(role).catch(() => {});
                        }
                        if (config.verify && config.verify.verificado) {
                            const role = guild.roles.cache.get(config.verify.verificado);
                            if (role) await member.roles.add(role).catch(() => {});
                        }
                    }
                }
                await message.reply('✅ ¡Verificación exitosa! Tu apodo ha sido actualizado y se te han asignado los roles correspondientes.');
            } else {
                await message.reply('❌ No encontré el código en tu descripción de Roblox. Asegúrate de haberlo puesto correctamente y vuelve a enviar tu usuario.');
            }
        }
    }
};
