const { SlashCommandBuilder } = require('discord.js');
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

        if (!user.kickable) {
            return interaction.reply({ content: '❌ No puedo expulsar a ese usuario.', ephemeral: true });
        }

        // Intentar enviar DM al usuario
        try {
            const dmEmbed = {
                title: '🚫 Has sido expulsado',
                description: `Fuiste expulsado del servidor **${interaction.guild.name}**`,
                fields: [
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                ],
                color: 0xff0000,
                timestamp: new Date()
            };
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {
            console.log(`No se pudo enviar DM a ${user.user.tag}`);
        }

        await user.kick(reason);
        await interaction.reply({ content: `✅ ${user.user.tag} ha sido expulsado. Razón: ${reason}` });
    }
};
