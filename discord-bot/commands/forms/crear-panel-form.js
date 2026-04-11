/**
 * commands/forms/crear-panel-form.js
 * Crea un panel con menú desplegable para seleccionar formularios.
 */

const {
  SlashCommandBuilder, PermissionFlagsBits, ModalBuilder,
  ActionRowBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');
const { getAllForms, getData, saveData } = require('../../utils/dataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crear-panel-form')
    .setDescription('📋 Crea un panel de formularios con menú desplegable (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const forms = getAllForms();
    if (forms.length === 0) {
      return interaction.reply({
        content: '❌ No hay formularios creados. Usa `/crear-form` primero.',
        ephemeral: true,
      });
    }

    // ── Modal para personalizar el panel ────────────────────
    const modal = new ModalBuilder()
      .setCustomId('panel_form_config')
      .setTitle('Configurar Panel de Formularios');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_title')
          .setLabel('Título del Panel')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('📋 Centro de Solicitudes')
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_description')
          .setLabel('Descripción del Panel')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Selecciona el formulario que deseas completar...')
          .setRequired(true)
          .setMaxLength(2000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_color')
          .setLabel('Color del Embed (Hex, ej: #EB459E)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('#5865F2')
          .setRequired(false)
          .setMaxLength(7)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('form_ids')
          .setLabel('IDs de formularios (uno por línea)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder(forms.slice(0, 3).map(f => f.id).join('\n'))
          .setRequired(true)
          .setMaxLength(2000)
      ),
    );

    await interaction.showModal(modal);

    let modalInteraction;
    try {
      modalInteraction = await interaction.awaitModalSubmit({
        time: 300_000,
        filter: i => i.customId === 'panel_form_config' && i.user.id === interaction.user.id,
      });
    } catch { return; }

    await modalInteraction.deferReply({ ephemeral: true });

    const title       = modalInteraction.fields.getTextInputValue('panel_title');
    const description = modalInteraction.fields.getTextInputValue('panel_description');
    const colorRaw    = modalInteraction.fields.getTextInputValue('panel_color') || '#5865F2';
    const formIdsRaw  = modalInteraction.fields.getTextInputValue('form_ids');

    const colorHex = parseInt(colorRaw.replace('#', ''), 16) || 0x5865F2;
    const formIds  = formIdsRaw.split('\n').map(s => s.trim()).filter(Boolean);

    // ── Validar formularios ──────────────────────────────────
    const selectedForms = formIds
      .map(id => forms.find(f => f.id === id))
      .filter(Boolean);

    if (selectedForms.length === 0) {
      return modalInteraction.editReply('❌ No encontré ningún formulario con esos IDs. Usa `/crear-form` para ver los IDs.');
    }

    // ── Construir embed y select menu ────────────────────────
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(colorHex)
      .addFields({
        name: '📋 Formularios disponibles',
        value: selectedForms.map(f => `• **${f.title}** — ${f.questions.length} preguntas`).join('\n'),
      })
      .setFooter({ text: '📋 Sistema de Formularios • Selecciona una opción del menú' })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_form')
      .setPlaceholder('📋 Selecciona un formulario...')
      .addOptions(
        selectedForms.map(f =>
          new StringSelectMenuOptionBuilder()
            .setLabel(f.title)
            .setValue(f.id)
            .setDescription(`${f.questions.length} preguntas`)
            .setEmoji('📋')
        )
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.channel.send({ embeds: [embed], components: [row] });

    // Guardar referencia
    const data = getData();
    data.formPanels.push({
      channelId: interaction.channelId,
      title,
      formIds:   selectedForms.map(f => f.id),
      createdAt: Date.now(),
      createdBy: interaction.user.id,
    });
    saveData(data);

    await modalInteraction.editReply('✅ ¡Panel de formularios creado correctamente!');
  },
};
