const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const usersPath = './data/users.json';

function loadUsers() {
    if (!fs.existsSync(usersPath)) return {};
    return JSON.parse(fs.readFileSync(usersPath));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Muestra el perfil de un usuario en el servidor')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id);
        if (!member) {
            return interaction.reply({ content: '❌ Usuario no encontrado en este servidor.', ephemeral: true });
        }

        const users = loadUsers();
        const robloxData = users[targetUser.id];
        const robloxName = robloxData ? robloxData.roblox : 'No registrado';

        // Verificar si el usuario tiene el rol de verificado (si está configurado)
        let config = {};
        if (fs.existsSync('./data/config.json')) {
            config = JSON.parse(fs.readFileSync('./data/config.json'));
        }
        const isVerified = config.verify && config.verify.verificado && member.roles.cache.has(config.verify.verificado);

        const embed = new EmbedBuilder()
            .setTitle(`📄 Perfil de ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor(isVerified ? '#00ff00' : '#ffaa00')
            .addFields(
                { name: '📅 Ingreso al servidor', value: `<t:${Math.floor(member.joinedAt / 1000)}:R>`, inline: true },
                { name: '🎮 Roblox', value: robloxName, inline: true },
                { name: '✅ Verificado', value: isVerified ? 'Sí' : 'No', inline: true },
                { name: '👑 Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `${r}`).join(', ') || 'Ninguno', inline: false }
            )
            .setFooter({ text: `ID: ${targetUser.id}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
