const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { Warn } = require('../../utils/database');

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
        const result = await Warn.deleteMany({ userId: user.id, guildId: interaction.guild.id });
        await interaction.reply({ content: `🗑️ Se eliminaron ${result.deletedCount} advertencias de ${user.tag}.` });
    }
};
