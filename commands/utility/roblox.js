const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const dataPath = './data/robloxUsers.json';

function loadUsers() {
    if (!fs.existsSync(dataPath)) return {};
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveUsers(users) {
    fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roblox')
        .setDescription('Asocia tu cuenta de Roblox a tu perfil')
        .addStringOption(opt => opt.setName('usuario').setDescription('Tu nombre de usuario de Roblox').setRequired(true)),

    async execute(interaction) {
        const robloxUser = interaction.options.getString('usuario');
        const userId = interaction.user.id;

        const users = loadUsers();
        users[userId] = robloxUser;
        saveUsers(users);

        const embed = new EmbedBuilder()
            .setTitle('✅ Cuenta de Roblox asociada')
            .setDescription(`Tu perfil ahora muestra el usuario: **${robloxUser}**`)
            .setColor('#00ff00');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
