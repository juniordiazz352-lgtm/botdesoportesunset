/**
 * interactions/buttonHandler.js
 * Gestiona todos los clicks de botones del bot.
 */

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, ChannelType,
} = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const {
  getConfig, getTicket, saveTicket, removeTicket, getData, saveData,
  checkSpam, getUserActiveTicket,
} = require('../utils/dataManager');
const {
  buildWelcomeEmbed, buildTicketButtons, STATUS_COLORS, capitalize,
} = require('../utils/ticketUtils');

module.exports = async function handleButton(interaction, client) {
  const { customId, guild, member, channel } = interaction;

  // ══════════════════════════════════════════════════════════
  //  BOTONES DE APERTURA DE TICKET (Panel → Modal)
  // ══════════════════════════════════════════════════════════
  if (customId.startsWith('open_ticket_')) {
    const category = customId.replace('open_ticket_', '');

    // ── Anti-spam: verificar ticket activo ──────────────────
    const activeTicket = getUserActiveTicket(member.id);
    if (activeTicket) {
      return interaction.reply({
        content: `❌ Ya tienes un ticket abierto: <#${activeTicket[0]}>. Ciérralo antes de abrir uno nuevo.`,
        ephemeral: true,
      });
    }

    // ── Anti-spam: cooldown de intentos ─────────────────────
    if (!checkSpam(member.id)) {
      return interaction.reply({
        content: '🚫 Has intentado abrir demasiados tickets. Espera **5 minutos** antes de intentarlo de nuevo.',
        ephemeral: true,
      });
    }

    // ── Disparar Modal para recopilar información ────────────
    const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${category}`)
      .setTitle(`Ticket de ${capitalize(category)}`);

    const reasonInput = new TextInputBuilder()
      .setCustomId('ticket_reason')
      .setLabel('¿Cuál es tu consulta?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Describe tu problema con el mayor detalle posible...')
      .setRequired(true)
      .setMinLength(20)
      .setMaxLength(1000);

    const priorityInput = new TextInputBuilder()
      .setCustomId('ticket_priority')
      .setLabel('Prioridad (baja / media / alta)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('media')
      .setRequired(false)
      .setMaxLength(5);

    modal.addComponents(
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(priorityInput),
    );

    return interaction.showModal(modal);
  }

  // ══════════════════════════════════════════════════════════
  //  BOTONES DE GESTIÓN DEL TICKET
  // ══════════════════════════════════════════════════════════
  const config  = getConfig();
  const ticket  = getTicket(channel.id);

  // ── Reclamar ticket ──────────────────────────────────────
  if (customId === 'ticket_claim') {
    if (!member.roles.cache.has(config.staffRole)) {
      return interaction.reply({ content: '❌ Solo el staff puede reclamar tickets.', ephemeral: true });
    }
    if (!ticket) return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true });
    if (ticket.claimedBy) {
      return interaction.reply({ content: `❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`, ephemeral: true });
    }

    // Actualizar nombre del canal
    const staffName = member.displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await channel.setName(`reclamado-${staffName}`).catch(() => {});

    // Actualizar datos
    ticket.claimedBy = member.id;
    ticket.claimedAt = Date.now();
    ticket.status    = 'claimed';
    saveTicket(channel.id, ticket);

    const embed = new EmbedBuilder()
      .setColor(STATUS_COLORS.claimed)
      .setDescription(`👤 **${member.displayName}** ha reclamado este ticket y se encargará de tu caso.`);

    return interaction.reply({ embeds: [embed] });
  }

  // ── En espera ────────────────────────────────────────────
  if (customId === 'ticket_waiting') {
    if (!member.roles.cache.has(config.staffRole)) {
      return interaction.reply({ content: '❌ Solo el staff puede cambiar el estado.', ephemeral: true });
    }
    if (!ticket) return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true });

    const userTag = ticket.userTag?.split('#')[0].toLowerCase().replace(/\s+/g, '-') || 'usuario';
    await channel.setName(`espera-${userTag}`).catch(() => {});

    ticket.status = 'waiting';
    saveTicket(channel.id, ticket);

    const embed = new EmbedBuilder()
      .setColor(STATUS_COLORS.waiting)
      .setDescription(`⏳ El ticket ha sido marcado como **En Espera**. <@${ticket.userId}>, por favor responde cuando puedas.`);

    return interaction.reply({ embeds: [embed] });
  }

  // ── Transcripción ────────────────────────────────────────
  if (customId === 'ticket_transcript') {
    if (!member.roles.cache.has(config.staffRole)) {
      return interaction.reply({ content: '❌ Solo el staff puede guardar transcripciones.', ephemeral: true });
    }
    if (!ticket) return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      const attachment = await createTranscript(channel, {
        filename:    `transcript-${channel.name}.html`,
        poweredBy:   false,
        returnType:  'attachment',
        saveImages:  true,
        footerText:  'Exportado el {date}',
      });

      const logChannel = guild.channels.cache.get(config.logChannel);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📑 Transcripción Guardada')
          .addFields(
            { name: 'Ticket',    value: channel.name,             inline: true },
            { name: 'Guardada por', value: member.toString(),    inline: true },
            { name: 'Usuario',   value: `<@${ticket.userId}>`,   inline: true },
          )
          .setColor(0x5865F2)
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
      }

      await interaction.editReply('✅ Transcripción guardada en el canal de logs.');
    } catch (err) {
      console.error('Error generando transcripción:', err);
      await interaction.editReply('❌ Error al generar la transcripción.');
    }
    return;
  }

  // ── Cerrar ticket (confirmación) ─────────────────────────
  if (customId === 'ticket_close') {
    if (!member.roles.cache.has(config.staffRole)) {
      return interaction.reply({ content: '❌ Solo el staff puede cerrar tickets.', ephemeral: true });
    }
    if (!ticket) return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true });

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close_confirm')
        .setLabel('Confirmar Cierre')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_close_cancel')
        .setLabel('Cancelar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      content: '⚠️ ¿Seguro que quieres cerrar y eliminar este ticket? Se guardará una transcripción.',
      components: [confirmRow],
      ephemeral: true,
    });
  }

  // ── Confirmar cierre ─────────────────────────────────────
  if (customId === 'ticket_close_confirm') {
    if (!ticket) return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true });

    await interaction.deferUpdate();

    try {
      // 1. Bloquear escritura inmediatamente
      await channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false }).catch(() => {});

      // 2. Generar transcripción HTML
      const attachment = await createTranscript(channel, {
        filename:   `transcript-${channel.name}.html`,
        poweredBy:  false,
        returnType: 'attachment',
        saveImages: true,
      });

      // 3. Calcular duración
      const durationMs  = Date.now() - ticket.openedAt;
      const durationMin = Math.floor(durationMs / 60_000);
      const durationStr = durationMin >= 60
        ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
        : `${durationMin} minutos`;

      // 4. Enviar al canal de logs
      const logChannel = guild.channels.cache.get(config.logChannel);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔒 Ticket Cerrado')
          .setColor(STATUS_COLORS.closed)
          .addFields(
            { name: '🎫 Ticket',        value: channel.name,                        inline: true },
            { name: '📂 Categoría',     value: capitalize(ticket.category),          inline: true },
            { name: '👤 Usuario',       value: `<@${ticket.userId}>`,               inline: true },
            { name: '🛡️ Staff',         value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Sin reclamar', inline: true },
            { name: '⏱️ Duración',      value: durationStr,                          inline: true },
            { name: '🔒 Cerrado por',   value: member.toString(),                   inline: true },
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
      }

      // 5. Enviar encuesta de satisfacción al usuario por DM
      await sendFeedbackDM(client, ticket, guild, channel.name);

      // 6. Eliminar ticket del registro
      removeTicket(channel.id);

      // 7. Eliminar canal con delay
      await channel.send({ embeds: [
        new EmbedBuilder()
          .setColor(STATUS_COLORS.closed)
          .setDescription('🔒 Este ticket ha sido cerrado. El canal se eliminará en **5 segundos**.'),
      ]});

      setTimeout(() => channel.delete('Ticket cerrado').catch(() => {}), 5000);

    } catch (err) {
      console.error('Error cerrando ticket:', err);
    }
    return;
  }

  // ── Cancelar cierre ──────────────────────────────────────
  if (customId === 'ticket_close_cancel') {
    return interaction.update({ content: '✅ Cierre cancelado.', components: [] });
  }

  // ══════════════════════════════════════════════════════════
  //  BOTONES DE FEEDBACK (DM al usuario)
  // ══════════════════════════════════════════════════════════
  if (customId.startsWith('feedback_')) {
    const parts    = customId.split('_');
    const rating   = parseInt(parts[1]);
    const ticketId = parts.slice(2).join('_');

    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    await interaction.update({
      content: `✅ ¡Gracias por tu valoración! Has calificado la atención con **${rating}/5** ${stars}`,
      components: [],
    });

    // Enviar al canal de logs
    const config = getConfig();
    const logChannel = guild?.channels?.cache?.get(config.logChannel) ||
      client.channels.cache.get(config.logChannel);

    if (logChannel) {
      const ratingEmbed = new EmbedBuilder()
        .setTitle('⭐ Valoración de Ticket')
        .setColor(rating >= 4 ? 0x57F287 : rating >= 2 ? 0xFEE75C : 0xED4245)
        .addFields(
          { name: 'Usuario',    value: interaction.user.toString(), inline: true },
          { name: 'Valoración', value: `${stars} (${rating}/5)`,    inline: true },
          { name: 'Ticket',     value: ticketId,                     inline: true },
        )
        .setTimestamp();
      await logChannel.send({ embeds: [ratingEmbed] });
    }

    // Guardar en data.json
    const data = getData();
    data.ratings.push({
      ticketId,
      userId:    interaction.user.id,
      rating,
      timestamp: Date.now(),
    });
    saveData(data);
    return;
  }

  // ══════════════════════════════════════════════════════════
  //  BOTONES DE FORMULARIOS (Aprobar / Rechazar)
  // ══════════════════════════════════════════════════════════
  if (customId.startsWith('form_approve_') || customId.startsWith('form_reject_')) {
    const isApprove  = customId.startsWith('form_approve_');
    const submissionId = customId.replace('form_approve_', '').replace('form_reject_', '');

    const data = getData();
    const submission = data.formSubmissions?.[submissionId];
    if (!submission) {
      return interaction.reply({ content: '❌ No se encontró esta respuesta.', ephemeral: true });
    }

    const { getForm } = require('../utils/dataManager');
    const form = getForm(submission.formId);

    if (isApprove) {
      // Enviar al canal de aprobados
      const approveChannel = guild.channels.cache.get(form?.approveChannel);
      if (approveChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`✅ Formulario Aprobado: ${form?.title || 'Formulario'}`)
          .setColor(0x57F287)
          .setDescription(submission.answers.map((a, i) => `**${i + 1}. ${a.question}**\n${a.answer}`).join('\n\n'))
          .addFields({ name: 'Usuario', value: `<@${submission.userId}>`, inline: true })
          .setTimestamp();
        await approveChannel.send({ embeds: [embed] });
      }
      await interaction.update({
        content: `✅ Formulario aprobado por ${member}. Enviado al canal de aprobados.`,
        components: [],
      });
    } else {
      // Modal para mensaje de rechazo
      const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
      const modal = new ModalBuilder()
        .setCustomId(`form_reject_reason_${submissionId}`)
        .setTitle('Razón del Rechazo');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('reject_reason')
            .setLabel('¿Por qué se rechaza?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true),
        ),
      );
      return interaction.showModal(modal);
    }
    return;
  }
};

// ── Función auxiliar: enviar encuesta por DM ────────────────
async function sendFeedbackDM(client, ticket, guild, channelName) {
  try {
    const user = await client.users.fetch(ticket.userId);
    const staffMember = ticket.claimedBy
      ? await guild.members.fetch(ticket.claimedBy).catch(() => null)
      : null;

    const row = new ActionRowBuilder().addComponents(
      ...[1, 2, 3, 4, 5].map(n =>
        new ButtonBuilder()
          .setCustomId(`feedback_${n}_${channelName}`)
          .setLabel(`${n}⭐`)
          .setStyle(n <= 2 ? ButtonStyle.Danger : n === 3 ? ButtonStyle.Secondary : ButtonStyle.Success)
      )
    );

    const embed = new EmbedBuilder()
      .setTitle('⭐ ¿Cómo fue tu experiencia?')
      .setDescription(
        `Tu ticket **${channelName}** ha sido cerrado.\n\n` +
        `Por favor, califica la atención recibida${staffMember ? ` de **${staffMember.displayName}**` : ''}.\n` +
        `Tu opinión nos ayuda a mejorar el servicio.`
      )
      .setColor(0xFEE75C)
      .setFooter({ text: 'Tienes 24 horas para valorar' });

    await user.send({ embeds: [embed], components: [row] });
  } catch (err) {
    // Usuario con DMs cerrados — ignorar silenciosamente
    console.log(`No se pudo enviar feedback DM a ${ticket.userId}: DMs cerrados.`);
  }
}
