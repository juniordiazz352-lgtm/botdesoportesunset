const { SlashCommandBuilder } = require('discord.js');
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

        await Warn.create({
            userId: user.id,
            guildId: interaction.guild.id,
            warnedBy: interaction.user.id,
            reason
        });

        // Actualizar estadísticas del staff que emitió la warn
        await StaffStat.findOneAndUpdate(
            { userId: interaction.user.id },
            { $inc: { warnsEmitidos: 1 } },
            { upsert: true, new: true }
        );

        await interaction.reply({ content: `⚠️ ${user.tag} ha sido advertido.\nRazón: ${reason}` });
    }
};
