/**
 * commands/utility/list-forms.js
 * Lista todos los formularios creados con sus IDs.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getAllForms } = require('../../utils/dataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listar-forms')
    .setDescription('📋 Muestra todos los formularios creados con sus IDs (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const forms = getAllForms();

    if (forms.length === 0) {
      return interaction.reply({
        content: '❌ No hay formularios creados. Usa `/crear-form` para crear uno.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Formularios Disponibles')
      .setColor(0x5865F2)
      .setDescription(
        forms.map(f =>
          `**${f.title}**\n` +
          `🆔 \`${f.id}\`\n` +
          `❓ ${f.questions.length} preguntas\n` +
          `📥 <#${f.reviewChannel}>\n`
        ).join('\n')
      )
      .setFooter({ text: `Total: ${forms.length} formulario(s)` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
