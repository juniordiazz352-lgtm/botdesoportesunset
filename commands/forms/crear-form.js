const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-form')
        .setDescription('Crea un formulario con preguntas personalizadas'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('crear_form_modal')
            .setTitle('Crear Formulario');

        const nombreInput = new TextInputBuilder()
            .setCustomId('nombre')
            .setLabel('Nombre del formulario')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: Solicitud de Staff')
            .setRequired(true)
            .setMaxLength(50);

        const preguntasInput = new TextInputBuilder()
            .setCustomId('preguntas')
            .setLabel('Preguntas (una por linea, max 5)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('¿Cuantos años tienes?\n¿Por que quieres unirte?\n¿Tienes experiencia?')
            .setRequired(true)
            .setMaxLength(1000);

        const canalInput = new TextInputBuilder()
            .setCustomId('canal_id')
            .setLabel('ID del canal donde van las respuestas')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678')
            .setRequired(true)
            .setMaxLength(20);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nombreInput),
            new ActionRowBuilder().addComponents(preguntasInput),
            new ActionRowBuilder().addComponents(canalInput)
        );

        await interaction.showModal(modal);
    }
};
