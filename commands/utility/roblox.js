const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const usersPath = './data/users.json';

function loadUsers() {
    if (!fs.existsSync(usersPath)) return {};
    return JSON.parse(fs.readFileSync(usersPath));
}

function saveUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roblox')
        .setDescription('Ver o establecer tu nombre de usuario de Roblox')
        .addSubcommand(sub => sub
            .setName('set')
            .setDescription('Establece tu usuario de Roblox')
            .addStringOption(opt => opt.setName('usuario').setDescription('Tu nombre de usuario de Roblox').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('get')
            .setDescription('Ver el Roblox de un usuario')
            .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const users = loadUsers();

        if (sub === 'set') {
            const robloxUser = interaction.options.getString('usuario');
            users[interaction.user.id] = {
                roblox: robloxUser,
                updatedAt: Date.now()
            };
            saveUsers(users);
            await interaction.reply({ content: `✅ Tu usuario de Roblox ha sido guardado como \`${robloxUser}\`.`, ephemeral: true });
        }

        else if (sub === 'get') {
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const data = users[targetUser.id];
            const robloxName = data ? data.roblox : 'No establecido';
            const embed = new EmbedBuilder()
                .setTitle(`🎮 Roblox de ${targetUser.username}`)
                .setDescription(`**Usuario:** ${robloxName}`)
                .setColor('#00aaff')
                .setFooter({ text: data ? `Actualizado: ${new Date(data.updatedAt).toLocaleString()}` : 'Sin registro' });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        }
    }
};
