module.exports = async (interaction) => {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // Ejecutar el comando (cada comando debe manejar su propio defer si es necesario)
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error en comando ${interaction.commandName}:`, error);
        // Si la interacción ya fue respondida o diferida, usar followUp
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
        }
    }
};
