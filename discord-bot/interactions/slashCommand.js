/**
 * interactions/slashCommand.js
 * Despacha los slash commands al handler correspondiente.
 */

module.exports = async function handleSlashCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`❌ Error ejecutando /${interaction.commandName}:`, error);
    const msg = { content: '❌ Error al ejecutar el comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
};
