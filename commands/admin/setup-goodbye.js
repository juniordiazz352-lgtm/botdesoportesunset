const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-goodbye')
        .setDescription('Configurar despedida')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de despedidas').setRequired(true))
        .addStringOption(opt => opt.setName('mensaje').setDescription('Mensaje (usa {user})').setRequired(true)),

    async execute(interaction) {
        const canal = interaction.options.getChannel('canal');
        const mensaje = interaction.options.getString('mensaje');

        let config = {};
        if (fs.existsSync('./data/config.json')) config = JSON.parse(fs.readFileSync('./data/config.json'));
        config.goodbye = { canal: canal.id, mensaje };
        fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('✅ Despedida configurada')
            .setDescription(`Canal: ${canal}\nMensaje: ${mensaje}`)
            .setColor('#ff9900');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
