/**
 * commands/tickets/ticket-manage.js
 * Comandos para agregar/quitar usuarios de tickets y más acciones de staff.
 */

const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
} = require('discord.js');
const { getConfig, getTicket } = require('../../utils/dataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Acciones de gestión de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('agregar')
        .setDescription('Agrega un usuario al ticket actual')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a agregar').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('quitar')
        .setDescription('Quita a un usuario del ticket actual')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a quitar').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('renombrar')
        .setDescription('Renombra el canal del ticket')
        .addStringOption(opt =>
          opt.setName('nombre').setDescription('Nuevo nombre').setRequired(true).setMaxLength(90)
        )
    ),

  async execute(interaction) {
    const { options, channel, guild, member } = interaction;
    const sub    = options.getSubcommand();
    const config = getConfig();
    const ticket = getTicket(channel.id);

    if (!ticket) {
      return interaction.reply({ content: '❌ Este canal no es un ticket activo.', ephemeral: true });
    }

    if (!member.roles.cache.has(config.staffRole)) {
      return interaction.reply({ content: '❌ Solo el staff puede usar estos comandos.', ephemeral: true });
    }

    if (sub === 'agregar') {
      const user = options.getUser('usuario');
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
      });
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`✅ <@${user.id}> fue agregado al ticket por ${member}.`);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'quitar') {
      const user = options.getUser('usuario');
      if (user.id === ticket.userId) {
        return interaction.reply({ content: '❌ No puedes quitar al creador del ticket.', ephemeral: true });
      }
      await channel.permissionOverwrites.delete(user.id);
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(`🚫 <@${user.id}> fue removido del ticket por ${member}.`);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'renombrar') {
      const nombre = options.getString('nombre')
        .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await channel.setName(nombre);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`✏️ Canal renombrado a **${nombre}** por ${member}.`),
        ],
      });
    }
  },
};
