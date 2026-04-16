const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

const formSessions = {};

function getForms() {
    if (fs.existsSync('./data/forms.json')) return JSON.parse(fs.readFileSync('./data/forms.json'));
    return {};
}
function saveForms(forms) {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/forms.json', JSON.stringify(forms, null, 2));
}

module.exports = async (interaction, client) => {
    try {

        // CREAR FORMULARIO — inicia sesion DM
        if (interaction.customId === 'crear_form_modal') {
            const nombre = interaction.fields.getTextInputValue('nombre').trim();
            const cantidadRaw = interaction.fields.getTextInputValue('cantidad').trim();
            const canalRespuestas = interaction.fields.getTextInputValue('canal_respuestas').trim();
            const canalAprobados = interaction.fields.getTextInputValue('canal_aprobados').trim();
            const canalRechazados = interaction.fields.getTextInputValue('canal_rechazados').trim();

            const cantidad = parseInt(cantidadRaw);
            if (isNaN(cantidad) || cantidad < 1 || cantidad > 18) {
                return interaction.reply({ content: '❌ La cantidad debe ser entre 1 y 18.', ephemeral: true });
            }
            if (!interaction.guild.channels.cache.get(canalRespuestas)) {
                return interaction.reply({ content: '❌ No encontre el canal de respuestas.', ephemeral: true });
            }
            if (!interaction.guild.channels.cache.get(canalAprobados)) {
                return interaction.reply({ content: '❌ No encontre el canal de aprobados.', ephemeral: true });
            }
            if (!interaction.guild.channels.cache.get(canalRechazados)) {
                return interaction.reply({ content: '❌ No encontre el canal de rechazados.', ephemeral: true });
            }

            let dm;
            try { dm = await interaction.user.createDM(); }
            catch (e) { return interaction.reply({ content: '❌ No pude abrirte un DM. Activa los mensajes directos.', ephemeral: true }); }

            formSessions[interaction.user.id] = {
                nombre, cantidad, canalRespuestas, canalAprobados, canalRechazados,
                guildId: interaction.guild.id,
                preguntas: [], paso: 0
            };

            await interaction.reply({ content: '📬 Te envie un DM para configurar las preguntas.', ephemeral: true });
            await dm.send({
                embeds: [new EmbedBuilder()
                    .setTitle('📋 Creando: ' + nombre)
                    .setDescription('Te hare **' + cantidad + '** pregunta(s) una por una.\nEscribe cada pregunta y enviala.\n\n⏰ **2 minutos** por pregunta.')
                    .setColor('#5865F2')
                    .setFooter({ text: 'Comenzando con la pregunta 1 de ' + cantidad })
                ]
            });
            await dm.send('✏️ **Pregunta 1 de ' + cantidad + ':**\n¿Cual sera la pregunta 1?');
            return;
        }

        // PANEL DE FORMULARIOS
        if (interaction.customId === 'panel_form_selector') {
            const titulo = interaction.fields.getTextInputValue('titulo');
            const descripcion = interaction.fields.getTextInputValue('descripcion');
            let color = interaction.fields.getTextInputValue('color') || '#5865F2';
            const raw = interaction.fields.getTextInputValue('form_list');
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#5865F2';

            const selectedNames = [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))];
            const forms = getForms();
            const validNames = selectedNames.filter(n => forms[n]);
            const invalidNames = selectedNames.filter(n => !forms[n]);

            if (validNames.length === 0) {
                return interaction.reply({ content: '❌ Ningun formulario valido. Usa /listar-forms para ver los nombres exactos.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(descripcion)
                .setColor(color)
                .addFields({
                    name: '📋 Formularios disponibles',
                    value: validNames.map(n => '📌 **' + n + '** — ' + forms[n].preguntas.length + ' preguntas').join('\n')
                })
                .setFooter({ text: 'Selecciona un formulario del menu de abajo' })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('form_select')
                .setPlaceholder('📋 Selecciona un formulario...')
                .addOptions(validNames.map(name => ({
                    label: name,
                    value: name,
                    description: forms[name].preguntas.length + ' preguntas',
                    emoji: '📋'
                })));

            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
            let reply = '✅ Panel creado con: ' + validNames.join(', ');
            if (invalidNames.length > 0) reply += '\n⚠️ No encontrados: ' + invalidNames.join(', ');
            return interaction.reply({ content: reply, ephemeral: true });
        }

        // RESPUESTAS DEL FORMULARIO ENVIADO POR USUARIO
        if (interaction.customId.startsWith('form_modal_')) {
            const formName = interaction.customId.replace('form_modal_', '');
            const forms = getForms();
            const formData = forms[formName];
            if (!formData) return interaction.reply({ content: '❌ Formulario no encontrado.', ephemeral: true });

            const respuestas = formData.preguntas.map((pregunta, i) => ({
                pregunta,
                respuesta: interaction.fields.getTextInputValue('pregunta_' + i)
            }));

            const embed = new EmbedBuilder()
                .setTitle('📋 Nueva Respuesta: ' + formName)
                .setColor('#5865F2')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setDescription(respuestas.map((r, i) => '**' + (i+1) + '. ' + r.pregunta + '**\n> ' + r.respuesta).join('\n\n'))
                .addFields({ name: '👤 Usuario', value: '<@' + interaction.user.id + '> (' + interaction.user.tag + ')', inline: true })
                .setTimestamp();

            const submissionId = interaction.user.id + '_' + Date.now();
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('form_approve_' + submissionId + '_' + formName)
                    .setLabel('Aprobar').setEmoji('✅').setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('form_reject_' + submissionId + '_' + formName)
                    .setLabel('Rechazar').setEmoji('❌').setStyle(ButtonStyle.Danger)
            );

            // Guardar respuestas temporalmente
            if (!fs.existsSync('./data')) fs.mkdirSync('./data');
            let submissions = {};
            if (fs.existsSync('./data/submissions.json')) submissions = JSON.parse(fs.readFileSync('./data/submissions.json'));
            submissions[submissionId] = {
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                formName,
                respuestas,
                canalAprobados: formData.canalAprobados,
                canalRechazados: formData.canalRechazados,
                timestamp: Date.now()
            };
            fs.writeFileSync('./data/submissions.json', JSON.stringify(submissions, null, 2));

            const canalRespuestas = interaction.guild.channels.cache.get(formData.canalRespuestas);
            if (canalRespuestas) {
                await canalRespuestas.send({ embeds: [embed], components: [row] });
                return interaction.reply({ content: '✅ Tu formulario fue enviado. El staff lo revisara pronto.', ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ No se encontro el canal de respuestas.', ephemeral: true });
            }
        }

        // RAZON DE RECHAZO
        if (interaction.customId.startsWith('form_reject_reason_')) {
            const submissionId = interaction.customId.replace('form_reject_reason_', '');
            const razon = interaction.fields.getTextInputValue('razon');
            let submissions = {};
            if (fs.existsSync('./data/submissions.json')) submissions = JSON.parse(fs.readFileSync('./data/submissions.json'));
            const sub = submissions[submissionId];
            if (!sub) return interaction.reply({ content: '❌ Respuesta no encontrada.', ephemeral: true });

            const canalRechazados = interaction.guild.channels.cache.get(sub.canalRechazados);
            if (canalRechazados) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Solicitud Rechazada: ' + sub.formName)
                    .setColor('#ED4245')
                    .setDescription(sub.respuestas.map((r, i) => '**' + (i+1) + '. ' + r.pregunta + '**\n> ' + r.respuesta).join('\n\n'))
                    .addFields(
                        { name: '👤 Usuario', value: '<@' + sub.userId + '>', inline: true },
                        { name: '❌ Razon', value: razon, inline: false }
                    ).setTimestamp();
                await canalRechazados.send({ embeds: [embed] });
            }

            try {
                const user = await client.users.fetch(sub.userId);
                await user.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('❌ Tu solicitud fue rechazada')
                        .setColor('#ED4245')
                        .setDescription('Tu formulario **' + sub.formName + '** fue rechazado.\n\n**Razon:** ' + razon)
                        .setTimestamp()
                    ]
                });
            } catch (e) {}

            delete submissions[submissionId];
            fs.writeFileSync('./data/submissions.json', JSON.stringify(submissions, null, 2));
            return interaction.update({ content: '✅ Rechazado y notificado.', components: [], embeds: [] });
        }

    } catch (error) {
        console.error('Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar.', ephemeral: true });
        }
    }
};

module.exports.formSessions = formSessions;
