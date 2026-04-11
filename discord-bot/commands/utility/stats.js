/**
 * commands/utility/stats.js
 * Muestra estadísticas del sistema de tickets y formularios.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getData, getConfig } = require('../../utils/dataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 Muestra estadísticas del sistema de soporte (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const data   = getData();
    const config = getConfig();

    const activeTickets  = Object.values(data.tickets).filter(t => t.status !== 'closed');
    const claimedTickets = activeTickets.filter(t => t.claimedBy);
    const waitingTickets = activeTickets.filter(t => t.status === 'waiting');
    const ratings        = data.ratings || [];
    const avgRating      = ratings.length > 0
      ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1)
      : 'Sin datos';

    // Estadísticas por categoría
    const byCategory = {};
    for (const [, t] of Object.entries(data.tickets)) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    }

    const catStats = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, count]) => `• **${cat}**: ${count}`)
      .join('\n') || 'Sin datos';

    const embed = new EmbedBuilder()
      .setTitle('📊 Estadísticas del Sistema de Soporte')
      .setColor(0x5865F2)
      .addFields(
        { name: '🎫 Tickets Activos',   value: `${activeTickets.length}`,  inline: true },
        { name: '👤 Reclamados',        value: `${claimedTickets.length}`, inline: true },
        { name: '⏳ En Espera',         value: `${waitingTickets.length}`, inline: true },
        { name: '⭐ Valoración Media',  value: `${avgRating}/5`,           inline: true },
        { name: '📋 Valoraciones',      value: `${ratings.length}`,        inline: true },
        { name: '📂 Top Categorías',    value: catStats,                   inline: false },
      )
      .setFooter({ text: `Canal de logs: ${config.logChannel ? `#${config.logChannel}` : 'No configurado'}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
