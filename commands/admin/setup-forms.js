const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-forms')
        .setDescription('Configurar canales para formularios aprobados/rechazados')
        .addChannelOption(opt => opt.setName('aprobados').setDescription('Canal para respuestas aprobadas').setRequired(true))
        .addChannelOption(opt => opt.setName('rechazados').setDescription('Canal para respuestas rechazadas').setRequired(true)),

    async execute(interaction) {
        const aprobados = interaction.options.getChannel('aprobados');
        const rechazados = interaction.options.getChannel('rechazados');

        let config = {};
        if (fs.existsSync('./data/config.json')) {
            config = JSON.parse(fs.readFileSync('./data/config.json'));
        }
        config.forms = {
            canalAprobados: aprobados.id,
            canalRechazados: rechazados.id
        };
        fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('✅ Canales de formularios configurados')
            .addFields(
                { name: '✅ Aprobados', value: `${aprobados}`, inline: true },
                { name: '❌ Rechazados', value: `${rechazados}`, inline: true }
            )
            .setColor('#00ff00');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
