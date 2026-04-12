const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-ticket')
        .setDescription('Crear panel dinámico de tickets'),

    async execute(interaction) {

        const modal = new ModalBuilder()
            .setCustomId('panel_ticket_modal')
            .setTitle('Crear Panel de Tickets');

        const title = new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Título')
            .setStyle(TextInputStyle.Short);

        const desc = new TextInputBuilder()
            .setCustomId('desc')
            .setLabel('Descripción')
            .setStyle(TextInputStyle.Paragraph);

        const buttons = new TextInputBuilder()
            .setCustomId('buttons')
            .setLabel('Botones (separados por coma)')
            .setPlaceholder('soporte, ayuda, compras')
            .setStyle(TextInputStyle.Short);

        modal.addComponents(
            new ActionRowBuilder().addComponents(title),
            new ActionRowBuilder().addComponents(desc),
            new ActionRowBuilder().addComponents(buttons)
        );

        await interaction.showModal(modal);
    }
};
