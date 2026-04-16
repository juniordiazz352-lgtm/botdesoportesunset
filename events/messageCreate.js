const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

        // ===== DM: SESION DE CREACION DE FORMULARIO (admin) =====
        if (message.channel.type === 1) {
            let formSessions = {};
            try { formSessions = require('../interactions/modalHandler').formSessions; } catch (e) {}

            const session = formSessions[message.author.id];
            if (session && session.preguntas !== undefined) {
                const pregunta = message.content.trim();
                if (!pregunta) return;
                session.preguntas.push(pregunta);
                session.paso++;

                if (session.paso < session.cantidad) {
                    const siguiente = session.paso + 1;
                    await message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#5865F2')
                            .setDescription('✅ Pregunta **' + session.paso + '** guardada.\n\n✏️ **Pregunta ' + siguiente + ' de ' + session.cantidad + ':**\n¿Cual sera la pregunta ' + siguiente + '?')
                            .setFooter({ text: 'Progreso: ' + session.paso + '/' + session.cantidad })
                        ]
                    });
                } else {
                    const forms = getForms();
                    forms[session.nombre] = {
                        nombre: session.nombre,
                        preguntas: session.preguntas,
                        canalRespuestas: session.canalRespuestas,
                        canalAprobados: session.canalAprobados,
                        canalRechazados: session.canalRechazados,
                        creadoPor: message.author.id,
                        creadoEn: Date.now()
                    };
                    saveForms(forms);
                    delete formSessions[message.author.id];

                    await message.reply({
                        embeds: [new EmbedBuilder()
                            .setTitle('✅ Formulario creado exitosamente')
                            .setColor('#57F287')
                            .addFields(
                                { name: '📋 Nombre', value: session.nombre, inline: true },
                                { name: '❓ Preguntas', value: session.cantidad.toString(), inline: true },
                                { name: '📥 Respuestas', value: '<#' + session.canalRespuestas + '>', inline: true },
                                { name: '✅ Aprobados', value: '<#' + session.canalAprobados + '>', inline: true },
                                { name: '❌ Rechazados', value: '<#' + session.canalRechazados + '>', inline: true },
                                { name: '📝 Preguntas guardadas', value: session.preguntas.map((p, i) => (i+1) + '. ' + p).join('\n') }
                            )
                            .setFooter({ text: 'Usa /crear-panel-form para mostrarlo en un canal' })
                        ]
                    });
                }
                return;
            }

            // ===== DM: SESION DE RESPUESTA DE FORMULARIO (usuario, +5 preguntas) =====
            let responseSessions = {};
            try {
                if (fs.existsSync('./data/responseSessions.json')) {
                    responseSessions = JSON.parse(fs.readFileSync('./data/responseSessions.json'));
                }
            } catch (e) {}

            const responseSession = responseSessions[message.author.id];
            if (responseSession) {
                const forms = getForms();
                const formData = forms[responseSession.formName];
                if (!formData) {
                    delete responseSessions[message.author.id];
                    fs.writeFileSync('./data/responseSessions.json', JSON.stringify(responseSessions, null, 2));
                    return;
                }

                responseSession.respuestas.push({
                    pregunta: formData.preguntas[responseSession.paso],
                    respuesta: message.content.trim()
                });
                responseSession.paso++;

                if (responseSession.paso < responseSession.total) {
                    await message.reply({
                        embeds: [new EmbedBuilder()
                            .setColor('#5865F2')
                            .setDescription('✅ Respuesta guardada.\n\n✏️ **Pregunta ' + (responseSession.paso + 1) + ' de ' + responseSession.total + ':**\n' + formData.preguntas[responseSession.paso])
                            .setFooter({ text: 'Progreso: ' + responseSession.paso + '/' + responseSession.total })
                        ]
                    });
                    fs.writeFileSync('./data/responseSessions.json', JSON.stringify(responseSessions, null, 2));
                } else {
                    // Todas respondidas — enviar al canal de respuestas
                    const guild = client.guilds.cache.get(responseSession.guildId);
                    if (guild) {
                        const canalRespuestas = guild.channels.cache.get(formData.canalRespuestas);
                        if (canalRespuestas) {
                            const submissionId = message.author.id + '_' + Date.now();
                            const embed = new EmbedBuilder()
                                .setTitle('📋 Nueva Respuesta: ' + responseSession.formName)
                                .setColor('#5865F2')
                                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                                .setDescription(responseSession.respuestas.map((r, i) => '**' + (i+1) + '. ' + r.pregunta + '**\n> ' + r.respuesta).join('\n\n'))
                                .addFields({ name: '👤 Usuario', value: '<@' + message.author.id + '> (' + message.author.tag + ')', inline: true })
                                .setTimestamp();

                            const row = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('form_approve_' + submissionId + '_' + responseSession.formName)
                                    .setLabel('Aprobar').setEmoji('✅').setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId('form_reject_' + submissionId + '_' + responseSession.formName)
                                    .setLabel('Rechazar').setEmoji('❌').setStyle(ButtonStyle.Danger)
                            );

                            // Guardar submission
                            let submissions = {};
                            if (fs.existsSync('./data/submissions.json')) submissions = JSON.parse(fs.readFileSync('./data/submissions.json'));
                            submissions[submissionId] = {
                                userId: message.author.id,
                                userTag: message.author.tag,
                                formName: responseSession.formName,
                                respuestas: responseSession.respuestas,
                                canalAprobados: formData.canalAprobados,
                                canalRechazados: formData.canalRechazados,
                                timestamp: Date.now()
                            };
                            fs.writeFileSync('./data/submissions.json', JSON.stringify(submissions, null, 2));
                            await canalRespuestas.send({ embeds: [embed], components: [row] });
                        }
                    }

                    delete responseSessions[message.author.id];
                    fs.writeFileSync('./data/responseSessions.json', JSON.stringify(responseSessions, null, 2));

                    await message.reply({
                        embeds: [new EmbedBuilder()
                            .setTitle('✅ Formulario enviado')
                            .setColor('#57F287')
                            .setDescription('Tu formulario **' + responseSession.formName + '** fue enviado correctamente.\nEl staff lo revisara y recibiras una notificacion.')
                            .setTimestamp()
                        ]
                    });
                }
                return;
            }

            // ===== DM: VERIFICACION ROBLOX =====
            const codes = require('../utils/robloxVerify').loadCodes?.() || {};
            const userData = codes[message.author.id];
            if (!userData || userData.verified) return;
            if ((Date.now() - userData.createdAt) > 10 * 60 * 1000) {
                await message.reply('❌ Tu codigo expiro. Ejecuta !verify nuevamente.');
                return;
            }
            const robloxUsername = message.content.trim();
            if (!robloxUsername) return;
            const isValid = await verifyCode(robloxUsername, userData.code);
            if (isValid) {
                markVerified(message.author.id, robloxUsername);
                const guild = client.guilds.cache.first();
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
                await message.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('✅ Verificacion exitosa!')
                        .setColor('#57F287')
                        .setDescription('Tu cuenta de Roblox **' + robloxUsername + '** fue verificada correctamente.\nTu apodo y roles han sido actualizados.')
                        .setTimestamp()
                    ]
                });
            } else {
                await message.reply('❌ No encontre el codigo en tu descripcion de Roblox. Asegurate de haberlo puesto y vuelve a intentar.');
            }
            return;
        }

        // ===== COMANDOS CON PREFIJO ! =====
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) return message.reply('❌ Escribe algo despues de !say');
            await message.channel.send(text);
            await message.delete().catch(() => {});
            return;
        }

        if (message.content.startsWith('!embed')) {
            const content = message.content.slice(7).trim();
            const sep = content.indexOf('|');
            const title = sep === -1 ? 'Anuncio' : content.slice(0, sep).trim();
            const desc = sep === -1 ? content : content.slice(sep + 1).trim();
            await message.channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle(title || 'Anuncio')
                    .setDescription(desc || 'Sin descripcion')
                    .setColor('#5865F2')
                    .setFooter({ text: 'Creado por ' + message.author.tag })
                    .setTimestamp()
                ]
            });
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!ping') {
            await message.reply('🏓 Pong! Latencia: ' + Math.round(message.client.ws.ping) + 'ms');
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!info') {
            await message.channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle('Informacion del Bot')
                    .setColor('#5865F2')
                    .addFields(
                        { name: 'Ping', value: Math.round(message.client.ws.ping) + 'ms', inline: true },
                        { name: 'Memoria', value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB', inline: true },
                        { name: 'Uptime', value: Math.floor(process.uptime() / 3600) + 'h ' + Math.floor((process.uptime() % 3600) / 60) + 'm', inline: true },
                        { name: 'Comandos', value: message.client.commands.size.toString(), inline: true }
                    ).setTimestamp()
                ]
            });
            await message.delete().catch(() => {});
            return;
        }

        if (message.content === '!verify') {
            const code = getOrCreateCode(message.author.id);
            try {
                const dm = await message.author.createDM();
                await dm.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('🔐 Verificacion Roblox')
                        .setDescription('**Tu codigo unico:** `' + code + '`\n\n**Pasos:**\n1. Copia el codigo\n2. Pegalo en tu **descripcion de perfil** de Roblox\n3. Responde con tu **nombre de usuario** de Roblox\n\n⏰ Tienes **10 minutos**.')
                        .setColor('#00ff00')
                    ]
                });
                await message.reply('✅ Revisa tus mensajes directos.');
            } catch (e) {
                await message.reply('❌ No pude enviarte DM. Activa los mensajes directos.');
            }
            await message.delete().catch(() => {});
            return;
        }
    }
};
