const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gestionar tickets')
        .addSubcommand(sub => sub.setName('add').setDescription('Agregar usuario').addUserOption(opt => opt.setName('user').setDescription('Usuario').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Quitar usuario').addUserOption(opt => opt.setName('user').setDescription('Usuario').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const channel = interaction.channel;
        
        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: '❌ Este no es un ticket', ephemeral: true });
        }
        
        if (sub === 'add') {
            await channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true
            });
            await interaction.reply({ content: `✅ ${user} agregado al ticket` });
        }
        
        if (sub === 'remove') {
            await channel.permissionOverwrites.delete(user.id);
            await interaction.reply({ content: `✅ ${user} removido del ticket` });
        }
    }
};
