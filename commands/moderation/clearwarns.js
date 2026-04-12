const { SlashCommandBuilder } = require('discord.js');
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
        if (!fs.existsSync(warnsPath)) return interaction.reply({ content: `${user} no tiene advertencias.`, ephemeral: true });
        let warns = JSON.parse(fs.readFileSync(warnsPath));
        if (!warns[user.id]) return interaction.reply({ content: `${user} no tiene advertencias.`, ephemeral: true });
        delete warns[user.id];
        fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));
        await interaction.reply({ content: `✅ Se eliminaron todas las advertencias de ${user}.` });
    }
};
