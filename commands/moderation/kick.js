const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsar a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('razón').setDescription('Motivo de la expulsión').setRequired(false)),
    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }
        const user = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razón') || 'Sin razón';
        if (!user.kickable) return interaction.reply({ content: '❌ No puedo kickear a ese usuario.', ephemeral: true });
        await user.kick(reason);
        await interaction.reply({ content: `✅ ${user.user.tag} ha sido kickeado. Razón: ${reason}` });
    }
};
