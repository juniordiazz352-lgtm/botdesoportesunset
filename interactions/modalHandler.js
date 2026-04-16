const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {
        // ============================================
        // CREAR FORMULARIO (modal con nombre, preguntas, canal)
        // ============================================
        if (interaction.customId === 'crear_form_modal') {
            const nombre = interaction.fields.getTextInputValue('nombre');
            const preguntasRaw = interaction.fields.getTextInputValue('preguntas');
            const canalRaw = interaction.fields.getTextInputValue('canal');

            // Extraer ID del canal de la mención o texto
            let canalId = canalRaw.replace(/[<#>]/g, '');
            const canal = interaction.guild.channels.cache.get(canalId);
            if (!canal) {
                return interaction.reply({ content: '❌ Canal inválido. Usa el ID o menciona el canal (#canal).', ephemeral: true });
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

            await interaction.reply({ content: `✅ Formulario "${nombre}" creado con ${preguntas.length} preguntas.\n📨 Las respuestas se enviarán a ${canal}.`, ephemeral: true });
            return;
        }

        // ============================================
        // PANEL DE FORMULARIOS (selector con título, descripción, color y formularios específicos)
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
                return interaction.reply({ content: '❌ Ninguno de los formularios existe. Usa `/listar-forms`.', ephemeral: true });
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

        // ============================================
        // RESPUESTA DE FORMULARIO (envío al canal guardado)
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

            // Construir descripción con preguntas y respuestas
            const fields = interaction.fields.fields;
            let description = '';
            fields.forEach(field => {
                description += `**${field.customId}:**\n${field.value}\n\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle(`📋 Nuevo formulario: ${formName}`)
                .setDescription(description)
                .setColor('#00aaff')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            // Enviar al canal configurado para este formulario
            const targetChannel = interaction.guild.channels.cache.get(form.canalId);
            if (targetChannel) {
                await targetChannel.send({ embeds: [embed] });
                await interaction.reply({ content: '✅ Formulario enviado correctamente.', ephemeral: true });
            } else {
                // Si el canal no existe, usar el canal de logs como respaldo
                let config = {};
                if (fs.existsSync('./data/config.json')) {
                    config = JSON.parse(fs.readFileSync('./data/config.json'));
                }
                const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                    await interaction.reply({ content: '✅ Formulario enviado al canal de logs (el canal original no existe).', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ No se pudo enviar el formulario: canal destino no encontrado.', ephemeral: true });
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar el formulario.', ephemeral: true });
        }
    }
};
