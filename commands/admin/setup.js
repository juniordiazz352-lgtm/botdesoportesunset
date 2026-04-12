const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configurar el bot')
        .addChannelOption(opt => opt.setName('logs').setDescription('Canal de logs').setRequired(true))
        .addRoleOption(opt => opt.setName('staff').setDescription('Rol staff').setRequired(true))
        .addChannelOption(opt => opt.setName('categoria').setDescription('Categoría de tickets').setRequired(true)),

    async execute(interaction) {
        const logs = interaction.options.getChannel('logs');
        const staff = interaction.options.getRole('staff');
        const categoria = interaction.options.getChannel('categoria');
        
        const config = { 
            canal_logs: logs.id, 
            rol_staff: staff.id, 
            categoria_tickets: categoria.id 
        };
        
        fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));
        
        await interaction.reply({ 
            content: `✅ Configuración guardada\n📋 Logs: ${logs}\n👥 Staff: ${staff}\n📁 Categoría: ${categoria}`,
            ephemeral: true 
        });
    }
};
