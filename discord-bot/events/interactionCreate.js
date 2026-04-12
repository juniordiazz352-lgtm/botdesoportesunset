const handleSlashCommand = require('../handlers/handleSlashCommand');
const buttonHandler = require('../interactions/buttonHandler');
const modalHandler = require('../interactions/modalHandler');
const selectMenuHandler = require('../interactions/selectMenuHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {

        try {

            // ─────────────────────────────
            // 💬 SLASH COMMANDS
            // ─────────────────────────────
            if (interaction.isChatInputCommand()) {
                return await handleSlashCommand(interaction);
            }

            // ─────────────────────────────
            // 🔘 BUTTONS
            // ─────────────────────────────
            if (interaction.isButton()) {
                return await buttonHandler(interaction);
            }

            // ─────────────────────────────
            // 📋 SELECT MENUS
            // ─────────────────────────────
            if (interaction.isStringSelectMenu()) {
                return await selectMenuHandler(interaction);
            }

            // ─────────────────────────────
            // 📝 MODALS
            // ─────────────────────────────
            if (interaction.isModalSubmit()) {
                return await modalHandler(interaction);
            }

        } catch (error) {
            console.error('❌ Error global interactionCreate:', error);

            // 🔥 MANEJO PRO DE ERRORES
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Error procesando la interacción.'
                    });
                } else if (interaction.replied) {
                    await interaction.followUp({
                        content: '❌ Error procesando la interacción.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Error procesando la interacción.',
                        ephemeral: true
                    });
                }
            } catch (e) {
                console.error('❌ Error enviando respuesta de error:', e);
            }
        }
    }
};
