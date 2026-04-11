/**
 * commands/forms/eliminar-form.js
 * Elimina un formulario por su ID.
 */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getForms, saveForms } = require('../../utils/dataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eliminar-form')
    .setDescription('🗑️ Elimina un formulario existente (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('ID del formulario (usa /listar-forms para verlos)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const id    = interaction.options.getString('id').trim();
    const forms = getForms();
    const idx   = forms.forms.findIndex(f => f.id === id);

    if (idx === -1) {
      return interaction.reply({
        content: `❌ No encontré un formulario con ID \`${id}\`. Usa \`/listar-forms\` para ver los IDs.`,
        ephemeral: true,
      });
    }

    const formTitle = forms.forms[idx].title;
    forms.forms.splice(idx, 1);
    saveForms(forms);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription(`🗑️ El formulario **${formTitle}** fue eliminado correctamente.`),
      ],
      ephemeral: true,
    });
  },
};
