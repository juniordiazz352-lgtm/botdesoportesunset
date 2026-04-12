const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silenciar a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a mutear').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutos').setDescription('Duración en minutos').setRequired(true))
        .addStringOption(opt => opt.setName('razón').setDescription('Motivo').setRequired(false)),
    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }
        const user = interaction.options.getMember('usuario');
        const minutes = interaction.options.getInteger('minutos');
        const reason = interaction.options.getString('razón') || 'Sin razón';
        const timeMs = minutes * 60 * 1000;
        if (timeMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ content: '❌ El tiempo máximo es 28 días.', ephemeral: true });
        }
        await user.timeout(timeMs, reason);
        await interaction.reply({ content: `✅ ${user.user.tag} muteado por ${minutes} minutos. Razón: ${reason}` });
    }
};
