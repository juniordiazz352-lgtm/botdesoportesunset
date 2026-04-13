const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Muestra estadísticas del bot'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Estadísticas del Bot')
            .addFields(
                { name: '📡 Ping', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
                { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: '📅 Uptime', value: `${Math.floor(process.uptime() / 86400)}d ${Math.floor((process.uptime() % 86400) / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true },
                { name: '📚 Comandos', value: `${interaction.client.commands.size}`, inline: true },
                { name: '🖥️ Servidor', value: interaction.guild.name, inline: true }
            )
            .setColor('#5865F2')
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }
};
