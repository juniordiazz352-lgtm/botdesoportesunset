module.exports = async (interaction) => {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error en ${interaction.commandName}:`, error);
        const reply = { content: '❌ Error ejecutando comando', ephemeral: true };
        if (!interaction.replied) await interaction.reply(reply).catch(() => {});
    }
};
