const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { getOrCreateCode, markVerified, verifyCode } = require('../utils/robloxVerify');

function getForms() {
    if (fs.existsSync('./data/forms.json')) return JSON.parse(fs.readFileSync('./data/forms.json'));
    return {};
}
function saveForms(forms) {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/forms.json', JSON.stringify(forms, null, 2));
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // ========== DM: SESION DE CREACION DE FORMULARIO ==========
        if (message.channel.type === 1) {
            // Importar sesiones del modalHandler
            let formSessions = {};
            try { formSessions = require('../interactions/modalHandler').formSessions; } catch (e) {}

            const session = formSessions[message.author.id];
            if (session) {
                const pregunta = message.content.trim();
                if (!pregunta) return;

                session.preguntas.push(pregunta);
                session.paso++;

                if (session.paso < session.cantidad) {
                    // Pedir siguiente pregunta
                    const siguiente = session.paso + 1;
                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#5865F2')
                                .setDescription('✅ Pregunta ' + session.paso + ' guardada.\n\n**Pregunta ' + siguiente + ' de ' + session.cantidad + ':** ¿Cual sera la siguiente pregunta?')
                                .setFooter({ text: 'Progreso: ' + session.paso + '/' + session.cantidad })
                        ]
                    });
                } else {
                    // Todas las preguntas recopiladas — guardar formulario
                    const forms = getForms();
                    forms[session.nombre] = {
                        nombre: session.nombre,
                        preguntas: session.preguntas,
                        canalRespuestas: session.canalId,
                        creadoPor: message.author.id,
                        creadoEn: Date.now()
                    };
                    saveForms(forms);
                    delete formSessions[message.author.id];

                    await message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('✅ Formulario creado exitosamente')
                                .setColor('#57F287')
                                .addFields(
                                    { name: '📋 Nombre', value: session.nombre, inline: true },
                                    { name: '❓ Preguntas', value: session.cantidad.toString(), inline: true },
                                    { name: '📥 Canal de respuestas', value: '<#' + session.canalId + '>', inline: true },
                                    { name: '📝 Lista de preguntas', value: session.preguntas.map((p, i) => (i + 1) + '. ' + p).join('\n') }
                                )
                                .setFooter({ text: 'Usa /crear-panel-form para agregarlo a un panel' })
                        ]
                    });
                }
                return;
            }

            // ========== DM: VERIFICACION ROBLOX ==========
            const codes = require('../utils/robloxVerify').loadCodes?.() || {};
            const userData = codes[message.author.id];
            if (!userData || userData.verified) return;
            if ((Date.now() - userData.createdAt) > 10 * 60 * 1000) {
                await message.reply('❌ Tu codigo ha expirado. Ejecuta !verify nuevamente.');
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
                    await member.setNickname(member.user.username + ' (@' + robloxUsername + ')').catch(() => {});
                    let config = {};
                    if (fs.existsSync('./data/config.json')) config = JSON.parse(fs.readFileSync('./data/config.json'));
                    if (config.verify?.noVerificado) {
                        const role = guild.roles.cache.get(config.verify.noVerificado);
                        if (role) await member.roles.remove(role).catch(() => {});
                    }
                    if (config.verify?.verificado) {
                        const role = guild.roles.cache.get(config.verify.verificado);
                        if (role) await member.roles.add(role).catch(() => {});
                    }
                }
                await message.reply('✅ Verificacion exitosa! Tu apodo ha sido actualizado.');
            } else {
                await message.reply('❌ No encontre el codigo en tu perfil de Roblox. Intentalo de nuevo.');
            }
            return;
        }

        // ========== COMANDOS CON PREFIJO ! ==========
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo despues de !say');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        if (message.content.startsWith('!embed')) {
            const content = message.content.slice(7).trim();
            const separatorIndex = content.indexOf('|');
            const title = separatorIndex === -1 ? 'Anuncio' : content.slice(0, separatorIndex).trim();
            const description = separatorIndex === -1 ? content : content.slice(separatorIndex + 1).trim();
            const embed = new EmbedBuilder()
                .setTitle(title || 'Anuncio')
                .setDescription(description || 'Sin descripcion')
                .setColor('#5865F2')
                .setFooter({ text: 'Creado por ' + message.author.tag })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!ping') {
            const ping = Math.round(message.client.ws.ping);
            await message.reply('🏓 Pong! Latencia: ' + ping + 'ms');
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!info') {
            const embed = new EmbedBuilder()
                .setTitle('Informacion del Bot')
                .setColor('#00ff00')
                .addFields(
                    { name: 'Ping', value: Math.round(message.client.ws.ping) + 'ms', inline: true },
                    { name: 'Memoria', value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB', inline: true },
                    { name: 'Uptime', value: Math.floor(process.uptime() / 3600) + 'h ' + Math.floor((process.uptime() % 3600) / 60) + 'm', inline: true },
                    { name: 'Comandos', value: message.client.commands.size.toString(), inline: true }
                )
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!tickets') {
            const ticketsPath = './data/tickets.json';
            if (fs.existsSync(ticketsPath)) {
                const tickets = JSON.parse(fs.readFileSync(ticketsPath));
                const userTickets = Object.values(tickets).filter(t => t.userId === message.author.id && t.status !== 'closed');
                if (userTickets.length === 0) {
                    await message.reply('No tienes tickets abiertos.');
                } else {
                    const embed = new EmbedBuilder().setTitle('Tus Tickets Abiertos').setColor('#5865F2');
                    userTickets.forEach(t => {
                        embed.addFields({ name: t.category || 'Ticket', value: 'Canal: <#' + t.channelId + '>', inline: true });
                    });
                    await message.channel.send({ embeds: [embed] });
                }
            } else {
                await message.reply('No hay tickets registrados.');
            }
            await message.delete().catch(() => {});
            return;
        }

        if (message.content.startsWith('!purge')) {
            let config = {};
            if (fs.existsSync('./data/config.json')) config = JSON.parse(fs.readFileSync('./data/config.json'));
            if (!message.member.roles.cache.has(config.rol_staff)) {
                return message.reply('No tienes permiso.').then(m => setTimeout(() => m.delete(), 3000));
            }
            const args = message.content.split(' ');
            let amount = Math.min(parseInt(args[1]) || 10, 100);
            const fetched = await message.channel.messages.fetch({ limit: amount });
            await message.channel.bulkDelete(fetched, true);
            const msg = await message.channel.send('Se borraron ' + fetched.size + ' mensajes.');
            setTimeout(() => msg.delete(), 3000);
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!verify') {
            const code = getOrCreateCode(message.author.id);
            const embed = new EmbedBuilder()
                .setTitle('Verificacion Roblox')
                .setDescription('**Tu codigo:** `' + code + '`\n\n1. Copia el codigo\n2. Pegalo en tu descripcion de Roblox\n3. Responde con tu nombre de usuario de Roblox\n\nTienes 10 minutos.')
                .setColor('#00ff00');
            try {
                const dm = await message.author.createDM();
                await dm.send({ embeds: [embed] });
                await message.reply('Revisa tus mensajes directos.');
            } catch (err) {
                await message.reply('No pude enviarte DM. Habilita los mensajes directos.');
            }
            await message.delete().catch(() => {});
            return;
        }
    }
};
