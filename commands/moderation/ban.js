const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banear a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
        .addStringOption(opt => opt.setName('razón').setDescription('Motivo del baneo').setRequired(false)),

    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        const user = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razón') || 'Sin razón';

        if (!user.bannable) {
            return interaction.reply({ content: '❌ No puedo banear a ese usuario.', ephemeral: true });
        }

        // DM
        try {
            const dmEmbed = {
                title: '🔨 Has sido baneado',
                description: `Fuiste baneado del servidor **${interaction.guild.name}**`,
                fields: [
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                ],
                color: 0xff0000,
                timestamp: new Date()
            };
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {}

        await user.ban({ reason });
        await interaction.reply({ content: `✅ ${user.user.tag} ha sido baneado. Razón: ${reason}` });
    }
};
