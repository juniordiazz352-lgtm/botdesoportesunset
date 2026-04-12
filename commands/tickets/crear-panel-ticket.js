const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-ticket')
        .setDescription('Crear panel de tickets con personalización avanzada'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('panel_ticket_modal')
            .setTitle('🎨 Configurar Panel de Tickets');
        
        // Título
        const tituloInput = new TextInputBuilder()
            .setCustomId('titulo')
            .setLabel('📌 Título del panel')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: Centro de Soporte')
            .setRequired(true);
        
        // Descripción
        const descInput = new TextInputBuilder()
            .setCustomId('descripcion')
            .setLabel('📝 Descripción del panel')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Elige una categoría para abrir un ticket...')
            .setRequired(true);
        
        // Color del embed (hex)
        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('🎨 Color del embed (hex)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#5865F2, #FF0000, #00FF00, etc.')
            .setRequired(false);
        
        // Botones: formato "nombre,emoji,color"
        const botonesInput = new TextInputBuilder()
            .setCustomId('botones')
            .setLabel('🔘 Botones (nombre|emoji|color)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ejemplos:\nSoporte|🎫|Primary\nVentas|💰|Success\nAyuda|❓|Secondary\nReporte|⚠️|Danger')
            .setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(tituloInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(botonesInput)
        );
        
        await interaction.showModal(modal);
    }
};
