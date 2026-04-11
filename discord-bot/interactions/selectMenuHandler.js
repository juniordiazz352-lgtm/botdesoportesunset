/**
 * interactions/selectMenuHandler.js
 * Gestiona los menús desplegables (Select Menus).
 * Principalmente para el panel de formularios.
 */

const { EmbedBuilder } = require('discord.js');
const { getForm, getData, saveData } = require('../utils/dataManager');

module.exports = async function handleSelectMenu(interaction, client) {
  const { customId, values, member, guild } = interaction;

  // ══════════════════════════════════════════════════════════
  //  SELECCIÓN DE FORMULARIO EN EL PANEL
  // ══════════════════════════════════════════════════════════
  if (customId === 'select_form') {
    const formId = values[0];
    const form   = getForm(formId);

    if (!form) {
      return interaction.reply({ content: '❌ Formulario no encontrado.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // ── Enviar preguntas al DM una a una ────────────────────
    const answers = [];
    let dmChannel;

    try {
      dmChannel = await member.user.createDM();
      await dmChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`📋 ${form.title}`)
            .setColor(0x5865F2)
            .setDescription(
              `Has iniciado el formulario **${form.title}**.\n\n` +
              `Tienes **3 minutos por pregunta** para responder. ` +
              `Si no respondes a tiempo, se pasará a la siguiente pregunta.\n\n` +
              `Total de preguntas: **${form.questions.length}**`
            ),
        ],
      });
    } catch (err) {
      return interaction.editReply('❌ No puedo enviarte un DM. Activa los mensajes directos del servidor.');
    }

    await interaction.editReply('✅ Te he enviado el formulario por DM. ¡Revisa tus mensajes!');

    // ── Iterar preguntas con timeout de 3 minutos c/u ───────
    for (let i = 0; i < form.questions.length; i++) {
      const question = form.questions[i];
      const TIMEOUT  = 3 * 60 * 1000; // 3 minutos

      await dmChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`Pregunta ${i + 1} de ${form.questions.length}`)
            .setDescription(`**${question}**`)
            .setFooter({ text: '⏰ Tienes 3 minutos para responder. Si no respondes, se omitirá.' }),
        ],
      });

      try {
        const filter    = m => m.author.id === member.id;
        const collected = await dmChannel.awaitMessages({ filter, max: 1, time: TIMEOUT, errors: ['time'] });
        const answer    = collected.first().content;
        answers.push({ question, answer });
        await dmChannel.send(`✅ Respuesta registrada. ${i < form.questions.length - 1 ? 'Siguiente pregunta...' : '¡Has completado el formulario!'}`);
      } catch {
        // Timeout — registrar como sin respuesta
        answers.push({ question, answer: '_Sin respuesta (tiempo agotado)_' });
        await dmChannel.send(`⏰ **Tiempo agotado** para esta pregunta. ${i < form.questions.length - 1 ? 'Pasando a la siguiente...' : 'Formulario completado.'}`);
      }
    }

    // ── Guardar respuesta y enviar al canal de revisión ─────
    const submissionId = `${member.id}_${Date.now()}`;
    const submission   = {
      formId,
      userId:    member.id,
      userTag:   member.user.tag,
      answers,
      submittedAt: Date.now(),
    };

    const data = getData();
    if (!data.formSubmissions) data.formSubmissions = {};
    data.formSubmissions[submissionId] = submission;
    saveData(data);

    // Enviar al canal de respuestas del formulario
    const reviewChannel = guild.channels.cache.get(form.reviewChannel);
    if (reviewChannel) {
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

      const embed = new EmbedBuilder()
        .setTitle(`📋 Nueva Respuesta: ${form.title}`)
        .setColor(0x5865F2)
        .setDescription(answers.map((a, i) => `**${i + 1}. ${a.question}**\n${a.answer}`).join('\n\n'))
        .addFields({ name: 'Usuario', value: `<@${member.id}> (${member.user.tag})`, inline: true })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`form_approve_${submissionId}`)
          .setLabel('Aprobar')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`form_reject_${submissionId}`)
          .setLabel('Rechazar')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger),
      );

      await reviewChannel.send({ embeds: [embed], components: [actionRow] });
    }

    // Confirmación final al usuario
    await dmChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ Formulario Enviado')
          .setColor(0x57F287)
          .setDescription(
            `Tu formulario **${form.title}** fue enviado correctamente.\n` +
            `El staff lo revisará y recibirás una notificación con el resultado.`
          ),
      ],
    });
    return;
  }
};
