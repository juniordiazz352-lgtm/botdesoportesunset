const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silenciar a un usuario temporalmente')
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

        // DM
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('🔇 Has sido muteado')
                .setDescription(`Fuiste muteado en **${interaction.guild.name}** por ${minutes} minutos.`)
                .addFields(
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                )
                .setColor(0xffaa00)
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {}

        await user.timeout(timeMs, reason);

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🔇 Muteo')
                .setColor(0xffaa00)
                .addFields(
                    { name: 'Usuario', value: user.user.tag, inline: true },
                    { name: 'Staff', value: interaction.user.tag, inline: true },
                    { name: 'Duración', value: `${minutes} minutos`, inline: true },
                    { name: 'Razón', value: reason, inline: false }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `✅ ${user.user.tag} muteado por ${minutes} minutos. Razón: ${reason}` });
    }
};
