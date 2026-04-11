/**
 * interactions/modalHandler.js
 * Gestiona el envío de todos los Modals (formularios emergentes).
 */

const { EmbedBuilder } = require('discord.js');
const {
  createTicketChannel, buildWelcomeEmbed, buildTicketButtons, capitalize,
} = require('../utils/ticketUtils');
const { getConfig, getData, saveData, getForm } = require('../utils/dataManager');

module.exports = async function handleModal(interaction, client) {
  const { customId, guild, member } = interaction;

  // ══════════════════════════════════════════════════════════
  //  MODAL DE APERTURA DE TICKET
  // ══════════════════════════════════════════════════════════
  if (customId.startsWith('ticket_modal_')) {
    const category = customId.replace('ticket_modal_', '');
    const reason   = interaction.fields.getTextInputValue('ticket_reason');
    const priority = interaction.fields.getTextInputValue('ticket_priority') || 'media';

    await interaction.deferReply({ ephemeral: true });

    try {
      const { channel, ticketData } = await createTicketChannel(guild, member, category);

      // Embed de bienvenida
      const welcomeEmbed = buildWelcomeEmbed(member, category, ticketData);

      // Agregar info del modal al embed
      welcomeEmbed.addFields(
        { name: '📋 Motivo',   value: reason,                            inline: false },
        { name: '⚡ Prioridad', value: capitalize(priority.toLowerCase()), inline: true  },
      );

      const buttons = buildTicketButtons();
      await channel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed], components: buttons });

      // Ping al staff
      const config    = getConfig();
      const staffRole = guild.roles.cache.get(config.staffRole);
      if (staffRole) await channel.send(`📢 ${staffRole} — Nuevo ticket de ${member}`);

      await interaction.editReply({ content: `✅ Tu ticket fue creado: ${channel}` });
    } catch (err) {
      console.error('Error creando ticket:', err);
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
    return;
  }

  // ══════════════════════════════════════════════════════════
  //  MODAL DE RAZÓN DE RECHAZO DE FORMULARIO
  // ══════════════════════════════════════════════════════════
  if (customId.startsWith('form_reject_reason_')) {
    const submissionId = customId.replace('form_reject_reason_', '');
    const reason       = interaction.fields.getTextInputValue('reject_reason');

    const data = getData();
    const submission = data.formSubmissions?.[submissionId];
    if (!submission) return interaction.reply({ content: '❌ Respuesta no encontrada.', ephemeral: true });

    const form = getForm(submission.formId);
    const rejectChannel = guild.channels.cache.get(form?.rejectChannel);

    if (rejectChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`❌ Formulario Rechazado: ${form?.title || 'Formulario'}`)
        .setColor(0xED4245)
        .setDescription(submission.answers.map((a, i) => `**${i + 1}. ${a.question}**\n${a.answer}`).join('\n\n'))
        .addFields(
          { name: 'Usuario',         value: `<@${submission.userId}>`, inline: true },
          { name: 'Razón de rechazo', value: reason,                   inline: false },
        )
        .setTimestamp();
      await rejectChannel.send({ embeds: [embed] });
    }

    // Notificar al usuario por DM
    try {
      const user = await client.users.fetch(submission.userId);
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`❌ Tu solicitud fue rechazada`)
            .setColor(0xED4245)
            .setDescription(`Tu formulario **${form?.title}** fue rechazado.\n\n**Razón:** ${reason}`),
        ],
      });
    } catch (e) { /* DMs cerrados */ }

    await interaction.update({ content: '✅ Rechazo registrado y enviado.', components: [] });
    return;
  }
};
