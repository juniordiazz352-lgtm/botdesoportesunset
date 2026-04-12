const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { StaffStat } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff-stats')
        .setDescription('Ver estadísticas de un staff')
        .addUserOption(opt => opt.setName('staff').setDescription('Miembro del staff').setRequired(true)),
    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        const staff = interaction.options.getUser('staff');
        const stats = await StaffStat.findOne({ userId: staff.id });

        if (!stats) {
            return interaction.reply({ content: `📊 ${staff.tag} aún no tiene estadísticas.`, ephemeral: true });
        }

        const promedioRating = stats.ratingCantidad > 0 ? (stats.ratingSuma / stats.ratingCantidad).toFixed(1) : 'Sin valoraciones';
        const tiempoPromedio = stats.ticketsResueltos > 0 ? Math.floor(stats.tiempoTotalSegundos / stats.ticketsResueltos) : 0;

        const embed = new EmbedBuilder()
            .setTitle(`📈 Estadísticas de ${staff.tag}`)
            .setColor('#00aaff')
            .addFields(
                { name: '🎫 Tickets resueltos', value: `${stats.ticketsResueltos}`, inline: true },
                { name: '👥 Tickets reclamados', value: `${stats.ticketsReclamados}`, inline: true },
                { name: '⭐ Rating promedio', value: `${promedioRating} ⭐`, inline: true },
                { name: '⏱️ Tiempo promedio por ticket', value: `${Math.floor(tiempoPromedio / 60)}m ${tiempoPromedio % 60}s`, inline: true },
                { name: '⚠️ Warns emitidas', value: `${stats.warnsEmitidos}`, inline: true }
            );
        await interaction.reply({ embeds: [embed] });
    }
};
