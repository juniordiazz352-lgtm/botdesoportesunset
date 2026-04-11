/**
 * commands/tickets/panel-ticket.js
 * Crea el panel visual de tickets con botones personalizados.
 * Abre un Modal para personalizar título, descripción y botones.
 */

const {
  SlashCommandBuilder, PermissionFlagsBits, ModalBuilder,
  ActionRowBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crear-panel-ticket')
    .setDescription('🎫 Crea un panel de tickets con botones personalizados (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // ── Paso 1: Modal con configuración del panel ────────────
    const modal = new ModalBuilder()
      .setCustomId('panel_ticket_config')
      .setTitle('Configurar Panel de Tickets');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_title')
          .setLabel('Título del Panel')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Centro de Soporte')
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_description')
          .setLabel('Descripción del Panel')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Selecciona una categoría para abrir un ticket...')
          .setRequired(true)
          .setMaxLength(2000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_color')
          .setLabel('Color del Embed (Hex, ej: #5865F2)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('#5865F2')
          .setRequired(false)
          .setMaxLength(7)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_categories')
          .setLabel('Categorías (una por línea, máx 5)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Soporte General\nReportar Bug\nSugerencia\nPagos')
          .setRequired(true)
          .setMaxLength(500)
      ),
    );

    await interaction.showModal(modal);

    // ── Esperar respuesta del modal ──────────────────────────
    let modalInteraction;
    try {
      modalInteraction = await interaction.awaitModalSubmit({ time: 300_000, filter: i => i.customId === 'panel_ticket_config' });
    } catch {
      return; // Timeout — el usuario cerró el modal
    }

    await modalInteraction.deferReply({ ephemeral: true });

    const title       = modalInteraction.fields.getTextInputValue('panel_title');
    const description = modalInteraction.fields.getTextInputValue('panel_description');
    const colorRaw    = modalInteraction.fields.getTextInputValue('panel_color') || '#5865F2';
    const categoriesRaw = modalInteraction.fields.getTextInputValue('panel_categories');

    // ── Parsear color hex ────────────────────────────────────
    const colorHex = parseInt(colorRaw.replace('#', ''), 16) || 0x5865F2;

    // ── Parsear categorías (máx 5) ───────────────────────────
    const EMOJI_MAP = ['🎫', '🐛', '💡', '💳', '📦'];
    const STYLE_MAP = ['Primary', 'Danger', 'Success', 'Secondary', 'Primary'];
    const categories = categoriesRaw
      .split('\n')
      .map(c => c.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (categories.length === 0) {
      return modalInteraction.editReply('❌ Debes agregar al menos una categoría.');
    }

    // ── Construir embed y botones ────────────────────────────
    const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJI_MAP[0]} ${title}`)
      .setDescription(description)
      .setColor(colorHex)
      .setFooter({ text: '🎫 Sistema de Tickets • Haz clic en un botón para abrir' })
      .setTimestamp();

    // Fila de botones (máx 5 por fila en Discord)
    const BUTTON_STYLES = {
      Primary: ButtonStyle.Primary,
      Secondary: ButtonStyle.Secondary,
      Success: ButtonStyle.Success,
      Danger: ButtonStyle.Danger,
    };

    const buttons = categories.map((cat, i) =>
      new ButtonBuilder()
        .setCustomId(`open_ticket_${cat.toLowerCase().replace(/\s+/g, '_')}`)
        .setLabel(cat)
        .setEmoji(EMOJI_MAP[i] || '🎫')
        .setStyle(BUTTON_STYLES[STYLE_MAP[i]] || ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder().addComponents(...buttons);

    // ── Enviar panel al canal actual ─────────────────────────
    await interaction.channel.send({ embeds: [embed], components: [row] });

    // ── Guardar referencia del panel ─────────────────────────
    const { getData, saveData } = require('../../utils/dataManager');
    const data = getData();
    data.panels.push({
      channelId:  interaction.channelId,
      title,
      categories,
      createdAt:  Date.now(),
      createdBy:  interaction.user.id,
    });
    saveData(data);

    await modalInteraction.editReply('✅ ¡Panel de tickets creado correctamente!');
  },
};
