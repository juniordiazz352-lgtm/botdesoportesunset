/**
 * events/interactionCreate.js
 * Router central de todas las interacciones del bot.
 * Rutas: Slash Commands → Botones → Modals → Select Menus
 */

const { InteractionType } = require('discord.js');

// ── Sub-handlers ─────────────────────────────────────────────
const handleSlashCommand   = require('../interactions/slashCommand');
const handleButton         = require('../interactions/buttonHandler');
const handleModal          = require('../interactions/modalHandler');
const handleSelectMenu     = require('../interactions/selectMenuHandler');

module.exports = {
  name: 'interactionCreate',
  once: false,

  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        return await handleSlashCommand(interaction, client);
      }
      if (interaction.isButton()) {
        return await handleButton(interaction, client);
      }
      if (interaction.isModalSubmit()) {
        return await handleModal(interaction, client);
      }
      if (interaction.isStringSelectMenu()) {
        return await handleSelectMenu(interaction, client);
      }
    } catch (error) {
      console.error('❌ Error en interacción:', error);
      const errorMsg = { content: '❌ Ocurrió un error al procesar esta acción. Intenta de nuevo.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg).catch(() => {});
      } else {
        await interaction.reply(errorMsg).catch(() => {});
      }
    }
  },
};
