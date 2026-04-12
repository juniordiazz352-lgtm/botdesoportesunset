const handleSlashCommand = require('../handlers/handleSlashCommand');
const buttonHandler = require('../interactions/buttonHandler');
const modalHandler = require('../interactions/modalHandler');
const selectMenuHandler = require('../interactions/selectMenuHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                return await handleSlashCommand(interaction);
            }
            if (interaction.isButton()) {
                return await buttonHandler(interaction);
            }
            if (interaction.isModalSubmit()) {
                return await modalHandler(interaction);
            }
            if (interaction.isStringSelectMenu()) {
                return await selectMenuHandler(interaction);
            }
        } catch (error) {
            console.error('❌ Error en interacción:', error);
            const reply = { content: '❌ Error en la interacción', ephemeral: true };
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(reply).catch(() => {});
            }
        }
    }
};
