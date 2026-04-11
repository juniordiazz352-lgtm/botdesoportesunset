/**
 * commands/admin/setup.js
 * Comando maestro de configuración del bot.
 * Uso: /setup canal_logs:#canal rol_staff:@rol categoria_tickets:ID
 */

const {
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType,
} = require('discord.js');
const { getConfig, saveConfig } = require('../../utils/dataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('⚙️ Configura el bot de soporte (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('canal_logs')
        .setDescription('Canal donde se enviarán las transcripciones y logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('rol_staff')
        .setDescription('Rol que puede gestionar los tickets')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('categoria_tickets')
        .setDescription('ID de la categoría donde se abrirán los tickets')
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('canal_formularios')
        .setDescription('Canal de logs/respuestas de formularios (opcional)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const { guild, options } = interaction;

    // ── Verificar permisos del bot ───────────────────────────
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: '❌ El bot necesita el permiso **Gestionar Canales** para funcionar.',
        ephemeral: true,
      });
    }

    const logChannel    = options.getChannel('canal_logs');
    const staffRole     = options.getRole('rol_staff');
    const categoryId    = options.getString('categoria_tickets').trim();
    const formChannel   = options.getChannel('canal_formularios');

    // ── Validar que la categoría existe ─────────────────────
    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: `❌ No encontré una categoría con el ID \`${categoryId}\`. Asegúrate de copiar el ID correcto (clic derecho → Copiar ID).`,
        ephemeral: true,
      });
    }

    // ── Guardar configuración ────────────────────────────────
    const config = getConfig();
    config.logChannel     = logChannel.id;
    config.staffRole      = staffRole.id;
    config.ticketCategory = category.id;
    if (formChannel) config.formChannel = formChannel.id;
    saveConfig(config);

    // ── Embed de confirmación ────────────────────────────────
    const embed = new EmbedBuilder()
      .setTitle('✅ Bot Configurado Correctamente')
      .setColor(0x57F287)
      .addFields(
        { name: '📋 Canal de Logs',        value: logChannel.toString(),  inline: true },
        { name: '🛡️ Rol de Staff',         value: staffRole.toString(),   inline: true },
        { name: '📁 Categoría de Tickets', value: category.name,          inline: true },
        { name: '📝 Canal de Formularios', value: formChannel ? formChannel.toString() : 'No configurado', inline: true },
      )
      .setFooter({ text: `Configurado por ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
