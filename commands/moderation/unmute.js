const { SlashCommandBuilder } = require('discord.js');
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

        // DM opcional (avisar que ya no está muteado)
        try {
            await user.send(`🔊 Has sido desmuteado en **${interaction.guild.name}** por ${interaction.user.tag}.`);
        } catch (err) {}

        await interaction.reply({ content: `✅ ${user.user.tag} ha sido desmuteado.` });
    }
};
