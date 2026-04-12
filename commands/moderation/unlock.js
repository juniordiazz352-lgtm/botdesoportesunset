const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Desbloquear el canal actual'),
    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null });
        await interaction.reply({ content: '🔓 Canal desbloqueado.' });
    }
};
