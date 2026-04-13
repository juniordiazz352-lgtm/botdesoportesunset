const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-ticket')
        .setDescription('Crea un panel de tickets personalizable'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('panel_ticket_modal')
            .setTitle('Configurar Panel de Tickets');

        const titulo = new TextInputBuilder()
            .setCustomId('titulo')
            .setLabel('Título del panel')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descripcion = new TextInputBuilder()
            .setCustomId('descripcion')
            .setLabel('Descripción del panel')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const color = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color del embed (hex, ej: #5865F2)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const botones = new TextInputBuilder()
            .setCustomId('botones')
            .setLabel('Botones (nombre|emoji|color) - uno por línea')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Soporte|🎫|primary\nVentas|💰|success\nAyuda|❓|secondary')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titulo),
            new ActionRowBuilder().addComponents(descripcion),
            new ActionRowBuilder().addComponents(color),
            new ActionRowBuilder().addComponents(botones)
        );

        await interaction.showModal(modal);
    }
};
