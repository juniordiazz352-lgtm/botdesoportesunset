const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-goodbye')
        .setDescription('Configurar canal y mensaje de despedida')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de despedida').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('mensaje').setDescription('Mensaje de despedida (usa {user})').setRequired(true)),
    async execute(interaction) {
        const configPath = './data/goodbye.json';
        let config = {};
        if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath));
        config.goodbyeChannel = interaction.options.getChannel('canal').id;
        config.goodbyeMessage = interaction.options.getString('mensaje');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        await interaction.reply({ content: '✅ Configuración de despedida guardada.', ephemeral: true });
    }
};
