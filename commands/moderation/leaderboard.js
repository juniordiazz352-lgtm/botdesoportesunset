const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { StaffStat } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Ranking de staff (top 10)'),
    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        // Top por tickets resueltos
        const topResueltos = await StaffStat.find().sort({ ticketsResueltos: -1 }).limit(10);
        // Top por rating promedio (mínimo 3 valoraciones para aparecer)
        const topRating = await StaffStat.aggregate([
            { $match: { ratingCantidad: { $gte: 3 } } },
            { $addFields: { avgRating: { $divide: ['$ratingSuma', '$ratingCantidad'] } } },
            { $sort: { avgRating: -1 } },
            { $limit: 10 }
        ]);

        let leaderboardText = '**🎫 Tickets resueltos**\n';
        for (let i = 0; i < topResueltos.length; i++) {
            const staff = await interaction.client.users.fetch(topResueltos[i].userId).catch(() => null);
            leaderboardText += `${i+1}. ${staff ? staff.tag : 'Usuario desconocido'} – ${topResueltos[i].ticketsResueltos}\n`;
        }
        leaderboardText += '\n**⭐ Mejor rating (min. 3 valoraciones)**\n';
        for (let i = 0; i < topRating.length; i++) {
            const staff = await interaction.client.users.fetch(topRating[i].userId).catch(() => null);
            const avg = (topRating[i].ratingSuma / topRating[i].ratingCantidad).toFixed(1);
            leaderboardText += `${i+1}. ${staff ? staff.tag : 'Usuario desconocido'} – ${avg} ⭐ (${topRating[i].ratingCantidad} valoraciones)\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranking de Staff')
            .setDescription(leaderboardText)
            .setColor('#gold');
        await interaction.reply({ embeds: [embed] });
    }
};
