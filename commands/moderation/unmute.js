const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Quitar el silencio a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a desmutear').setRequired(true)),

    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        const user = interaction.options.getMember('usuario');
        await user.timeout(null);

        // DM
        try {
            await user.send(`🔊 Has sido desmuteado en **${interaction.guild.name}** por ${interaction.user.tag}.`);
        } catch (err) {}

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🔊 Desmuteo')
                .setColor(0x00ff00)
                .addFields(
                    { name: 'Usuario', value: user.user.tag, inline: true },
                    { name: 'Staff', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `✅ ${user.user.tag} ha sido desmuteado.` });
    }
};
