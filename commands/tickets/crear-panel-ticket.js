const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-ticket')
        .setDescription('Crear panel de tickets con botones dinámicos'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('panel_ticket_modal')
            .setTitle('Configurar Panel de Tickets');
        
        const tituloInput = new TextInputBuilder()
            .setCustomId('titulo')
            .setLabel('Título del panel')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const descInput = new TextInputBuilder()
            .setCustomId('descripcion')
            .setLabel('Descripción del panel')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        
        const botonesInput = new TextInputBuilder()
            .setCustomId('botones')
            .setLabel('Botones (separados por coma)')
            .setPlaceholder('soporte, ventas, ayuda')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(tituloInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(botonesInput)
        );
        
        await interaction.showModal(modal);
    }
};
