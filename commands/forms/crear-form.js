const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-form')
        .setDescription('Crear un formulario'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('crear_form_modal')
            .setTitle('Crear Formulario');
        
        const nombreInput = new TextInputBuilder()
            .setCustomId('nombre')
            .setLabel('Nombre del formulario')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        modal.addComponents(new ActionRowBuilder().addComponents(nombreInput));
        
        await interaction.showModal(modal);
    }
};
