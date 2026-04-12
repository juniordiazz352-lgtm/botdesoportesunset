const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Configurar canal y mensaje de bienvenida')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de bienvenida').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('mensaje').setDescription('Mensaje de bienvenida (usa {user} para el nombre, {server} para el servidor)').setRequired(true))
        .addStringOption(opt => opt.setName('imagen_fondo').setDescription('URL de imagen de fondo para la bienvenida').setRequired(false)),
    async execute(interaction) {
        const configPath = './data/welcome.json';
        let config = {};
        if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath));
        config.welcomeChannel = interaction.options.getChannel('canal').id;
        config.welcomeMessage = interaction.options.getString('mensaje');
        config.welcomeImage = interaction.options.getString('imagen_fondo') || null;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        await interaction.reply({ content: '✅ Configuración de bienvenida guardada.', ephemeral: true });
    }
};
