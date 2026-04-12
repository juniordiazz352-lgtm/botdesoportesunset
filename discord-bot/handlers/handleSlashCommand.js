module.exports = async (interaction) => {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error en comando ${interaction.commandName}:`, error);

        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Error ejecutando el comando.',
                ephemeral: true
            });
        }
    }
};
