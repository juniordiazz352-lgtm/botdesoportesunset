const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {
        // ============================================
        // CREAR FORMULARIO (modal)
        // ============================================
        if (interaction.customId === 'crear_form_modal') {
            const nombre = interaction.fields.getTextInputValue('nombre');
            const preguntasRaw = interaction.fields.getTextInputValue('preguntas');
            const canalRaw = interaction.fields.getTextInputValue('canal');

            let canalId = canalRaw.replace(/[<#>]/g, '');
            const canal = interaction.guild.channels.cache.get(canalId);
            if (!canal) {
                return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
            }

            const preguntas = preguntasRaw.split('\n').filter(p => p.trim().length > 0);
            if (preguntas.length === 0) {
                return interaction.reply({ content: '❌ Debes escribir al menos una pregunta.', ephemeral: true });
            }

            const formsPath = './data/forms.json';
            let forms = {};
            if (fs.existsSync(formsPath)) forms = JSON.parse(fs.readFileSync(formsPath));
            forms[nombre] = {
                preguntas: preguntas,
                canalId: canal.id,
                creadoPor: interaction.user.id,
                creadoEn: Date.now()
            };
            fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2));

            await interaction.reply({ content: `✅ Formulario "${nombre}" creado con ${preguntas.length} preguntas.`, ephemeral: true });
            return;
        }

        // ============================================
        // RESPUESTA DE FORMULARIO (guardar pendiente y notificar staff)
        // ============================================
        if (interaction.customId.startsWith('form_modal_')) {
            const formName = interaction.customId.replace('form_modal_', '');
            const formsPath = './data/forms.json';
            if (!fs.existsSync(formsPath)) {
                return interaction.reply({ content: '❌ Error: formulario no encontrado.', ephemeral: true });
            }
            const forms = JSON.parse(fs.readFileSync(formsPath));
            const form = forms[formName];
            if (!form) {
                return interaction.reply({ content: '❌ Formulario no existe.', ephemeral: true });
            }

            // Recoger respuestas
            const fields = interaction.fields.fields;
            const respuestas = {};
            fields.forEach(field => {
                respuestas[field.customId] = field.value;
            });

            // Guardar en pendientes
            const pendingPath = './data/pendingForms.json';
            let pending = {};
            if (fs.existsSync(pendingPath)) pending = JSON.parse(fs.readFileSync(pendingPath));
            const submissionId = Date.now().toString();
            pending[submissionId] = {
                formName: formName,
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                respuestas: respuestas,
                timestamp: Date.now(),
                status: 'pending'
            };
            fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));

            // Notificar al staff en el canal de logs (o un canal específico de moderación)
            let config = {};
            if (fs.existsSync('./data/config.json')) {
                config = JSON.parse(fs.readFileSync('./data/config.json'));
            }
            const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle(`📝 Nuevo formulario pendiente: ${formName}`)
                    .setDescription(`**Usuario:** ${interaction.user.tag}\n**ID:** ${submissionId}`)
                    .addFields({ name: 'Respuestas', value: 'Usa los botones para aprobar o rechazar' })
                    .setColor('#ffaa00')
                    .setTimestamp();
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`approve_${submissionId}`).setLabel('✅ Aprobar').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId(`reject_${submissionId}`).setLabel('❌ Rechazar').setStyle(ButtonStyle.Danger)
                    );
                await logChannel.send({ embeds: [embed], components: [row] });
            }

            await interaction.reply({ content: '✅ Formulario enviado. Un staff lo revisará y te notificará por DM.', ephemeral: true });
            return;
        }

        // ============================================
        // PANEL DE FORMULARIOS (selector)
        // ============================================
        if (interaction.customId === 'panel_form_selector') {
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('descripcion');
            const color = interaction.fields.getTextInputValue('color') || '#5865F2';
            const formulariosRaw = interaction.fields.getTextInputValue('formularios');

            const formNames = formulariosRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const formsPath = './data/forms.json';
            let forms = {};
            if (fs.existsSync(formsPath)) forms = JSON.parse(fs.readFileSync(formsPath));
            const validForms = formNames.filter(name => forms[name]);
            if (validForms.length === 0) {
                return interaction.reply({ content: '❌ Ninguno de los formularios existe.', ephemeral: true });
            }

            const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(desc)
                .setColor(color)
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('form_select')
                .setPlaceholder('Selecciona un formulario')
                .addOptions(validForms.map(name => ({
                    label: name,
                    value: name,
                    description: `${forms[name].preguntas.length} preguntas`
                })));

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Panel creado con los formularios: ${validForms.join(', ')}`, ephemeral: true });
            return;
        }

    } catch (error) {
        console.error('❌ Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar el formulario.', ephemeral: true });
        }
    }
};
