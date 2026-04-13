const handleSlashCommand = require('../handlers/handleSlashCommand');
const buttonHandler = require('../interactions/buttonHandler');
const modalHandler = require('../interactions/modalHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await buttonHandler(interaction);
            } else if (interaction.isModalSubmit()) {
                await modalHandler(interaction);
            }
        } catch (error) {
            console.error('❌ Error en interactionCreate:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Error al procesar la interacción.', ephemeral: true });
            }
        }
    }
};
