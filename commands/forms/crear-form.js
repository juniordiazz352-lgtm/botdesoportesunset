const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-form')
        .setDescription('Crea un formulario con hasta 18 preguntas')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('crear_form_modal')
            .setTitle('Crear Formulario');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('nombre')
                    .setLabel('Nombre del formulario')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: Solicitud de Staff')
                    .setRequired(true).setMaxLength(50)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('cantidad')
                    .setLabel('Cuantas preguntas tendra? (1 al 18)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 7')
                    .setRequired(true).setMaxLength(2)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('canal_respuestas')
                    .setLabel('ID del canal de respuestas')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('123456789012345678')
                    .setRequired(true).setMaxLength(20)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('canal_aprobados')
                    .setLabel('ID del canal de aprobados')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('123456789012345678')
                    .setRequired(true).setMaxLength(20)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('canal_rechazados')
                    .setLabel('ID del canal de rechazados')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('123456789012345678')
                    .setRequired(true).setMaxLength(20)
            )
        );
        await interaction.showModal(modal);
    }
};
