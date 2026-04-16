const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configuración principal del bot')
        .addChannelOption(opt => opt.setName('logs').setDescription('Canal de logs').setRequired(true))
        .addRoleOption(opt => opt.setName('staff').setDescription('Rol staff').setRequired(true))
        .addStringOption(opt => opt.setName('categoria').setDescription('ID de la categoría para tickets').setRequired(true))
        .addChannelOption(opt => opt.setName('feedback').setDescription('Canal para valoraciones').setRequired(true)),

    async execute(interaction) {
        const logs = interaction.options.getChannel('logs');
        const staff = interaction.options.getRole('staff');
        const categoriaId = interaction.options.getString('categoria');
        const feedback = interaction.options.getChannel('feedback');

        const categoria = interaction.guild.channels.cache.get(categoriaId);
        if (!categoria || categoria.type !== 4) {
            return interaction.reply({ content: '❌ ID de categoría inválido. Usa el ID numérico.', ephemeral: true });
        }

        const config = {
            canal_logs: logs.id,
            rol_staff: staff.id,
            categoria_tickets: categoria.id,
            canal_feedback: feedback.id
        };
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('✅ Configuración guardada')
            .addFields(
                { name: '📋 Logs', value: `${logs}`, inline: true },
                { name: '👥 Staff', value: `${staff}`, inline: true },
                { name: '📁 Categoría', value: `${categoria.name} (ID: ${categoria.id})`, inline: true },
                { name: '⭐ Feedback', value: `${feedback}`, inline: true }
            )
            .setColor('#00ff00');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
