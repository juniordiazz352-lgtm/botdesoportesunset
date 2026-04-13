const { SlashCommandBuilder } = require('discord.js');
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

        // Guardar warn (en data/warns.json)
        const warnsPath = './data/warns.json';
        let warns = {};
        if (fs.existsSync(warnsPath)) warns = JSON.parse(fs.readFileSync(warnsPath));
        if (!warns[user.id]) warns[user.id] = [];
        warns[user.id].push({ warnedBy: interaction.user.id, reason, date: Date.now() });
        fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

        // Enviar DM
        try {
            const dmEmbed = {
                title: '⚠️ Has recibido una advertencia',
                description: `En el servidor **${interaction.guild.name}**`,
                fields: [
                    { name: '👮 Staff', value: interaction.user.tag, inline: true },
                    { name: '📝 Razón', value: reason, inline: true }
                ],
                color: 0xffaa00,
                timestamp: new Date()
            };
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {}

        await interaction.reply({ content: `⚠️ ${user.tag} ha sido advertido. Razón: ${reason}` });
    }
};
