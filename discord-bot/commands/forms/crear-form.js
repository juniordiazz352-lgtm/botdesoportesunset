/**
 * commands/forms/crear-form.js
 * Asistente interactivo para crear formularios personalizados.
 * Usa DMs para recopilar la configuración paso a paso.
 */

const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType,
} = require('discord.js');
const { saveForm } = require('../../utils/dataManager');
const { v4: uuidv4 } = (() => {
  // UUID simple sin dependencia externa
  return { v4: () => `${Date.now()}-${Math.random().toString(36).slice(2)}` };
})();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crear-form')
    .setDescription('📋 Crea un formulario interactivo con preguntas personalizadas (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.reply({ content: '📬 Te envié un DM para configurar el formulario paso a paso.', ephemeral: true });

    let dm;
    try {
      dm = await interaction.user.createDM();
    } catch {
      return interaction.followUp({ content: '❌ No puedo enviarte DMs. Activa los mensajes directos.', ephemeral: true });
    }

    const filter  = m => m.author.id === interaction.user.id;
    const TIMEOUT = 120_000; // 2 minutos por paso

    const ask = async (prompt) => {
      await dm.send(prompt);
      try {
        const collected = await dm.awaitMessages({ filter, max: 1, time: TIMEOUT, errors: ['time'] });
        return collected.first().content.trim();
      } catch {
        await dm.send('⏰ Tiempo agotado. Usa `/crear-form` de nuevo para empezar.');
        return null;
      }
    };

    try {
      // ── Paso 1: Título ───────────────────────────────────────
      const title = await ask(
        '**📋 Paso 1/6 — Título del formulario**\n¿Cuál será el nombre del formulario? (ej: *Solicitud de Staff*)'
      );
      if (!title) return;

      // ── Paso 2: Número de preguntas ──────────────────────────
      const numStr = await ask(
        '**❓ Paso 2/6 — Preguntas**\n¿Cuántas preguntas tendrá el formulario? (mín: 1, máx: 10)'
      );
      if (!numStr) return;

      const numQuestions = Math.min(10, Math.max(1, parseInt(numStr) || 1));

      // ── Paso 3: Ingresar cada pregunta ───────────────────────
      const questions = [];
      for (let i = 1; i <= numQuestions; i++) {
        const q = await ask(`**📝 Pregunta ${i}/${numQuestions}**\nEscribe el texto de la pregunta ${i}:`);
        if (!q) return;
        questions.push(q);
      }

      // ── Paso 4: Canal de revisión/respuestas ─────────────────
      const reviewChStr = await ask(
        '**📥 Paso 4/6 — Canal de Revisión**\nMenciona o pega el ID del canal donde el staff revisará las respuestas:'
      );
      if (!reviewChStr) return;

      const reviewChannelId = reviewChStr.replace(/[<#>]/g, '').trim();
      const reviewChannel   = interaction.guild.channels.cache.get(reviewChannelId);
      if (!reviewChannel) {
        await dm.send(`❌ No encontré el canal con ID \`${reviewChannelId}\`. Cancela y usa el ID correcto.`);
        return;
      }

      // ── Paso 5: Canal de aprobados ───────────────────────────
      const approveChStr = await ask(
        '**✅ Paso 5/6 — Canal de Aprobados**\nMenciona o pega el ID del canal donde irán las solicitudes aprobadas:'
      );
      if (!approveChStr) return;

      const approveChannelId = approveChStr.replace(/[<#>]/g, '').trim();
      const approveChannel   = interaction.guild.channels.cache.get(approveChannelId);
      if (!approveChannel) {
        await dm.send(`❌ No encontré el canal con ID \`${approveChannelId}\`.`);
        return;
      }

      // ── Paso 6: Canal de rechazados ──────────────────────────
      const rejectChStr = await ask(
        '**❌ Paso 6/6 — Canal de Rechazados**\nMenciona o pega el ID del canal donde irán las solicitudes rechazadas:'
      );
      if (!rejectChStr) return;

      const rejectChannelId = rejectChStr.replace(/[<#>]/g, '').trim();
      const rejectChannel   = interaction.guild.channels.cache.get(rejectChannelId);
      if (!rejectChannel) {
        await dm.send(`❌ No encontré el canal con ID \`${rejectChannelId}\`.`);
        return;
      }

      // ── Guardar formulario ────────────────────────────────────
      const formId = `form_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const formData = {
        id: formId,
        title,
        questions,
        reviewChannel:  reviewChannelId,
        approveChannel: approveChannelId,
        rejectChannel:  rejectChannelId,
        createdBy: interaction.user.id,
        createdAt: Date.now(),
      };
      saveForm(formData);

      // ── Resumen final ─────────────────────────────────────────
      const summary = new EmbedBuilder()
        .setTitle('✅ Formulario Creado')
        .setColor(0x57F287)
        .addFields(
          { name: '📋 Título',             value: title,                          inline: false },
          { name: '❓ Preguntas',           value: questions.map((q, i) => `${i + 1}. ${q}`).join('\n'), inline: false },
          { name: '📥 Canal de Revisión',  value: `<#${reviewChannelId}>`,        inline: true },
          { name: '✅ Canal Aprobados',    value: `<#${approveChannelId}>`,        inline: true },
          { name: '❌ Canal Rechazados',   value: `<#${rejectChannelId}>`,         inline: true },
          { name: '🆔 ID del Formulario',  value: `\`${formId}\``,               inline: false },
        )
        .setFooter({ text: 'Usa /crear-panel-form para agregar este formulario a un panel' });

      await dm.send({ embeds: [summary] });

    } catch (err) {
      console.error('Error en /crear-form:', err);
      await dm.send('❌ Ocurrió un error inesperado. Intenta de nuevo.').catch(() => {});
    }
  },
};
