const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-form')
        .setDescription('Crea un panel visual con formularios'),
    async execute(interaction) {
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) {
            return interaction.reply({ content: 'No hay formularios creados. Usa /crear-form primero.', ephemeral: true });
        }
        const forms = JSON.parse(fs.readFileSync(formsPath));
        const formNames = Object.keys(forms);
        if (formNames.length === 0) {
            return interaction.reply({ content: 'No hay formularios creados.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('panel_form_selector')
            .setTitle('Configurar Panel de Formularios');

        const tituloInput = new TextInputBuilder()
            .setCustomId('titulo')
            .setLabel('Titulo del panel')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: Centro de Solicitudes')
            .setRequired(true)
            .setMaxLength(100);

        const descripcionInput = new TextInputBuilder()
            .setCustomId('descripcion')
            .setLabel('Descripcion del panel')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Selecciona el formulario que deseas completar...')
            .setRequired(true)
            .setMaxLength(1000);

        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color del embed (hex, ej: #EB459E)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#5865F2')
            .setRequired(false)
            .setMaxLength(7);

        const formListInput = new TextInputBuilder()
            .setCustomId('form_list')
            .setLabel('Formularios a mostrar (separados por coma)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(formNames.join(', '))
            .setRequired(true)
            .setMaxLength(500);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tituloInput),
            new ActionRowBuilder().addComponents(descripcionInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(formListInput)
        );

        await interaction.showModal(modal);
    }
};
