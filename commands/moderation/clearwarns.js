const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Eliminar todas las advertencias de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true)),

    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const warnsPath = './data/warns.json';
        if (fs.existsSync(warnsPath)) {
            let warns = JSON.parse(fs.readFileSync(warnsPath));
            if (warns[user.id]) {
                delete warns[user.id];
                fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));
            }
        }

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('🗑️ Advertencias eliminadas')
                .setColor(0x00ff00)
                .addFields(
                    { name: 'Usuario', value: user.tag, inline: true },
                    { name: 'Staff', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `✅ Se eliminaron las advertencias de ${user.tag}.` });
    }
};
