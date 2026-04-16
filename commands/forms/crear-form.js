const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-form')
        .setDescription('Crear un nuevo formulario (con canal de respuestas)'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('crear_form_modal')
            .setTitle('Crear Formulario');

        const nombreInput = new TextInputBuilder()
            .setCustomId('nombre')
            .setLabel('Nombre del formulario')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const preguntasInput = new TextInputBuilder()
            .setCustomId('preguntas')
            .setLabel('Preguntas (una por línea)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const canalInput = new TextInputBuilder()
            .setCustomId('canal')
            .setLabel('ID o mención del canal para respuestas')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#canal o ID numérico')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nombreInput),
            new ActionRowBuilder().addComponents(preguntasInput),
            new ActionRowBuilder().addComponents(canalInput)
        );

        await interaction.showModal(modal);
    }
};
