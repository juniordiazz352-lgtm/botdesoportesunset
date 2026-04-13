const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advertir a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(opt => opt.setName('razón').setDescription('Motivo').setRequired(false)),

    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razón') || 'Sin razón';

        // Guardar warn
        const warnsPath = './data/warns.json';
        let warns = {};
        if (fs.existsSync(warnsPath)) warns = JSON.parse(fs.readFileSync(warnsPath));
        if (!warns[user.id]) warns[user.id] = [];
        warns[user.id].push({ warnedBy: interaction.user.id, reason, date: Date.now() });
        fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

        // DM
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('⚠️ Has recibido una advertencia')
                .setDescription(`En el servidor **${interaction.guild.name}**`)
                .addFields(
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                )
                .setColor(0xffaa00)
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {}

        // Log
        const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('⚠️ Advertencia')
                .setColor(0xffaa00)
                .addFields(
                    { name: 'Usuario', value: user.tag, inline: true },
                    { name: 'Staff', value: interaction.user.tag, inline: true },
                    { name: 'Razón', value: reason, inline: false }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: `⚠️ ${user.tag} ha sido advertido. Razón: ${reason}` });
    }
};
