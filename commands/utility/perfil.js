const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const robloxDataPath = './data/robloxUsers.json';

function loadRobloxUsers() {
    if (!fs.existsSync(robloxDataPath)) return {};
    return JSON.parse(fs.readFileSync(robloxDataPath));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Ver perfil de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar (opcional)').setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id);

        const robloxUsers = loadRobloxUsers();
        const robloxName = robloxUsers[targetUser.id] || 'No asociado';

        const embed = new EmbedBuilder()
            .setTitle(`📄 Perfil de ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor('#5865F2')
            .addFields(
                { name: '🆔 ID', value: targetUser.id, inline: true },
                { name: '📅 Se unió', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🤖 Es bot', value: targetUser.bot ? 'Sí' : 'No', inline: true },
                { name: '🎮 Roblox', value: robloxName, inline: false }
            )
            .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
            .setTimestamp();

        // Agregar lista de roles (máximo 3 para no saturar)
        const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString());
        const rolesText = roles.length ? roles.slice(0, 10).join(', ') + (roles.length > 10 ? '...' : '') : 'Ninguno';
        embed.addFields({ name: '👑 Roles', value: rolesText, inline: false });

        await interaction.reply({ embeds: [embed] });
    }
};
