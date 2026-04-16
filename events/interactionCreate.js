const handleSlashCommand = require('../handlers/handleSlashCommand');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;
        await handleSlashCommand(interaction);
    }
};
