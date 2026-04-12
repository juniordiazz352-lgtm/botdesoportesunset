const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = async (interaction) => {
    try {
        if (interaction.customId.startsWith('create_ticket_')) {
            const category = interaction.customId.replace('create_ticket_', '');
            
            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${category}`)
                .setTitle(`Ticket - ${category.charAt(0).toUpperCase() + category.slice(1)}`);
            
            const input = new TextInputBuilder()
                .setCustomId('motivo')
                .setLabel('¿Cuál es tu problema?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        
        if (interaction.customId === 'ticket_claim') {
            await interaction.reply({ content: `👤 Ticket reclamado por ${interaction.user}`, ephemeral: false });
        }
        
        if (interaction.customId === 'ticket_close') {
            await interaction.reply({ content: '🔒 Cerrando ticket en 5 segundos...' });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
    } catch (error) {
        console.error('❌ Error en buttonHandler:', error);
    }
};
