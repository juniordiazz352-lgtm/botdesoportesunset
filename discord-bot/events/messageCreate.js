/**
 * events/messageCreate.js
 * Maneja comandos con prefijo: !say y !embed
 */

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    // Ignorar bots y mensajes sin prefijo
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args    = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ── !say ────────────────────────────────────────────────
    // El bot te hace una pregunta y repite tu respuesta en el canal.
    if (command === 'say') {
      // Solo admins pueden usar !say
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
      }

      // Eliminar el comando del autor
      await message.delete().catch(() => {});

      // DM al usuario para pedirle el mensaje
      try {
        const dm = await message.author.send(
          '💬 **!say** — Escribe el mensaje que quieres enviar al canal. Tienes **60 segundos**.'
        );

        const filter   = m => m.author.id === message.author.id;
        const collected = await dm.channel.awaitMessages({ filter, max: 1, time: 60_000, errors: ['time'] });
        const texto     = collected.first().content;

        await message.channel.send(texto);
        await message.author.send('✅ Tu mensaje fue enviado.');
      } catch (err) {
        if (err.size === 0 || err.message?.includes('time')) {
          await message.author.send('⏰ Tiempo agotado. No se envió ningún mensaje.').catch(() => {});
        } else {
          console.error('Error en !say:', err);
        }
      }
      return;
    }

    // ── !embed ───────────────────────────────────────────────
    // Genera un embed de anuncio con título, descripción, fecha y autor.
    if (command === 'embed') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply({ content: '❌ No tienes permisos para usar este comando.' });
      }

      await message.delete().catch(() => {});

      try {
        // Paso 1: Pedir título
        const dmChannel = await message.author.createDM();
        await dmChannel.send('📢 **!embed** — Paso 1/2: ¿Cuál es el **título** del anuncio? (60 seg)');

        const filterDM  = m => m.author.id === message.author.id;
        const titleColl = await dmChannel.awaitMessages({ filter: filterDM, max: 1, time: 60_000, errors: ['time'] });
        const title     = titleColl.first().content;

        // Paso 2: Pedir descripción
        await dmChannel.send('📝 Paso 2/2: ¿Cuál es la **descripción** del anuncio? (120 seg)');
        const descColl  = await dmChannel.awaitMessages({ filter: filterDM, max: 1, time: 120_000, errors: ['time'] });
        const desc      = descColl.first().content;


        //module.exports
        module.exports = async (message) => {
    if (message.author.bot) return;

    // solo tickets
    if (!message.channel.name.startsWith('ticket-') && 
        !message.channel.name.startsWith('reclamado-')) return;

    // enviar al dashboard
    if (global.io) {
        global.io.emit('message', {
            user: message.author.username,
            content: message.content
        });
    }
};



        // Construir el embed de anuncio
        const embed = new EmbedBuilder()
          .setTitle(`📢 ${title}`)
          .setDescription(desc)
          .setColor(0xEB459E)
          .setTimestamp()
          .setFooter({
            text: `Anuncio creado por ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });

        await message.channel.send({ embeds: [embed] });
        await dmChannel.send('✅ ¡Anuncio enviado correctamente!');
      } catch (err) {
        await message.author.send('⏰ Tiempo agotado o error. Intenta de nuevo.').catch(() => {});
        console.error('Error en !embed:', err);
      }
      return;
    }
  },
};
