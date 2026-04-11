/**
 * utils/ticketUtils.js
 * Funciones auxiliares compartidas por los módulos de tickets.
 */

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');
const { getConfig, saveTicket, getNextTicketNumber } = require('./dataManager');

// ── Colores por estado ────────────────────────────────────────
const STATUS_COLORS = {
  open:    0x57F287, // Verde
  claimed: 0xFEE75C, // Amarillo
  waiting: 0xFF9933, // Naranja
  closed:  0xED4245, // Rojo
};

/**
 * Crea un canal de ticket con permisos correctos.
 * @param {Guild} guild
 * @param {GuildMember} member
 * @param {string} category  - nombre de la categoría del botón (ej: "soporte")
 * @returns {{ channel, ticketData }}
 */
async function createTicketChannel(guild, member, category) {
  const config = getConfig();
  if (!config.ticketCategory || !config.staffRole) {
    throw new Error('El bot no está configurado. Usa `/setup` primero.');
  }

  const number   = getNextTicketNumber(category);
  const safeCat  = category.toLowerCase().replace(/\s+/g, '-');
  const name     = `ticket-${safeCat}-${number}`;

  const staffRole = guild.roles.cache.get(config.staffRole);
  if (!staffRole) throw new Error('El rol de staff no existe.');

  // Permisos del canal
  const permissionOverwrites = [
    {
      id: guild.id, // @everyone no puede ver
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: member.id, // El usuario SÍ puede ver
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: staffRole.id, // El staff SÍ puede ver
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.members.me.id, // El bot tiene acceso total
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages],
    },
  ];

  const channel = await guild.channels.create({
    name,
    parent: config.ticketCategory,
    permissionOverwrites,
    reason: `Ticket abierto por ${member.user.tag}`,
  });

  const ticketData = {
    userId:     member.id,
    userTag:    member.user.tag,
    category,
    channelId:  channel.id,
    openedAt:   Date.now(),
    claimedBy:  null,
    status:     'open',
    number,
  };

  saveTicket(channel.id, ticketData);
  return { channel, ticketData };
}

/**
 * Genera el Embed de bienvenida dentro del ticket.
 */
function buildWelcomeEmbed(member, category, ticketData) {
  return new EmbedBuilder()
    .setTitle(`🎫 Ticket de ${capitalize(category)}`)
    .setDescription(
      `Hola ${member}, has abierto un ticket de **${capitalize(category)}**.\n\n` +
      `Un miembro del staff te atenderá en breve. Por favor describe tu consulta.\n\n` +
      `📋 **Ticket #${ticketData.number}** | 📅 <t:${Math.floor(ticketData.openedAt / 1000)}:F>`
    )
    .setColor(STATUS_COLORS.open)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Sistema de Soporte • Usa los botones de abajo para acciones rápidas' });
}

/**
 * Genera los botones de acción del ticket.
 */
function buildTicketButtons(isStaff = false) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('Reclamar')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_waiting')
      .setLabel('En Espera')
      .setEmoji('⏳')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_transcript')
      .setLabel('Transcripción')
      .setEmoji('📑')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Cerrar')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
  );
  return [row1];
}

/**
 * Capitaliza la primera letra.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  createTicketChannel,
  buildWelcomeEmbed,
  buildTicketButtons,
  STATUS_COLORS,
  capitalize,
};
