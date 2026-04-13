const handleSlashCommand = require('../handlers/handleSlashCommand');
const buttonHandler = require('../interactions/buttonHandler');
const modalHandler = require('../interactions/modalHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction, client);
            } else if (interaction.isButton()) {
                await buttonHandler(interaction, client);
            } else if (interaction.isModalSubmit()) {
                await modalHandler(interaction, client);
            } else if (interaction.isStringSelectMenu()) {
                const selectHandler = require('../interactions/selectMenuHandler');
                await selectHandler(interaction, client);
            }
        } catch (error) {
            console.error('❌ Error en interactionCreate:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Error al procesar la interacción.', ephemeral: true });
            }
        }
    }
};
