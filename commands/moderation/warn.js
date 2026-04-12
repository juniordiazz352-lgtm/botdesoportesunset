const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { Warn, StaffStat } = require('../../utils/database');

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

        // Guardar warn (usando JSON si no hay MongoDB)
        const warnsPath = './data/warns.json';
        let warns = {};
        if (fs.existsSync(warnsPath)) warns = JSON.parse(fs.readFileSync(warnsPath));
        if (!warns[user.id]) warns[user.id] = [];
        warns[user.id].push({ warnedBy: interaction.user.id, reason, date: Date.now() });
        fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Usuario advertido')
            .setDescription(`${user} ha sido advertido por ${interaction.user}`)
            .addFields({ name: 'Razón', value: reason })
            .setColor('#ff9900');
        await interaction.reply({ embeds: [embed] });
    }
};
