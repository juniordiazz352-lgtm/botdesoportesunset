const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { Warn } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warns')
        .setDescription('Ver advertencias de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true)),
    async execute(interaction) {
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const warns = await Warn.find({ userId: user.id, guildId: interaction.guild.id });

        if (warns.length === 0) {
            return interaction.reply({ content: `✅ ${user.tag} no tiene advertencias.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Advertencias de ${user.tag}`)
            .setColor('#ff9900');
        warns.forEach((w, i) => {
            embed.addFields({ name: `#${i+1}`, value: `**Staff:** <@${w.warnedBy}>\n**Razón:** ${w.reason}\n**Fecha:** ${w.date.toLocaleString()}`, inline: false });
        });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
