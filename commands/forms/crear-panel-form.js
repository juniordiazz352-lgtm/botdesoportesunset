const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-form')
        .setDescription('Crea un panel con los formularios que elijas'),

    async execute(interaction) {
        // Verificar que existan formularios
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) {
            return interaction.reply({ content: '❌ No hay formularios creados. Usa `/crear-form` primero.', ephemeral: true });
        }
        const forms = JSON.parse(fs.readFileSync(formsPath));
        const formNames = Object.keys(forms);
        if (formNames.length === 0) {
            return interaction.reply({ content: '❌ No hay formularios creados.', ephemeral: true });
        }

        // Crear modal para que el usuario ingrese los nombres de los formularios
        const modal = new ModalBuilder()
            .setCustomId('panel_form_selector')
            .setTitle('Seleccionar formularios');

        const input = new TextInputBuilder()
            .setCustomId('form_list')
            .setLabel('Nombres de formularios (separados por coma)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(formNames.join(', '))
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }
};
