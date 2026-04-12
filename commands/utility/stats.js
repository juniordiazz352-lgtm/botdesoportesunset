const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Ver estadísticas del bot'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Estadísticas')
            .setDescription(`**Comandos:** ${interaction.client.commands.size}`)
            .addFields(
                { name: '📡 Ping', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
                { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: '📅 Uptime', value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true }
            )
            .setColor('#5865F2')
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
