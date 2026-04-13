const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

        // DM al usuario
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('🚫 Has sido expulsado')
                .setDescription(`Fuiste expulsado del servidor **${interaction.guild.name}**`)
                .addFields(
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                )
                .setColor(0xff0000)
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {}

        // Ejecutar expulsión
        await user.kick(reason);

        // Log al canal de logs
        const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('👢 Expulsión')
                .setColor(0xff0000)
                .addFields(
                    { name: 'Usuario', value: user.user.tag, inline: true },
                    { name: 'Staff', value: interaction.user.tag, inline: true },
                    { name: 'Razón', value: reason, inline: false }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `✅ ${user.user.tag} ha sido expulsado. Razón: ${reason}` });
    }
};
