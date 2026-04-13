const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

        // DM al usuario
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('🔨 Has sido baneado')
                .setDescription(`Fuiste baneado del servidor **${interaction.guild.name}**`)
                .addFields(
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                )
                .setColor(0xff0000)
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {}

        await user.ban({ reason });

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🔨 Baneo')
                .setColor(0xff0000)
                .addFields(
                    { name: 'Usuario', value: user.user.tag, inline: true },
                    { name: 'Staff', value: interaction.user.tag, inline: true },
                    { name: 'Razón', value: reason, inline: false }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `✅ ${user.user.tag} ha sido baneado. Razón: ${reason}` });
    }
};
