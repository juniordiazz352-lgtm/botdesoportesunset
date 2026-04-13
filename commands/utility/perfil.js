const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Ver perfil de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id);

        // Obtener Roblox asociado
        let robloxName = 'No asociado';
        let robloxUrl = null;
        const robloxPath = './data/robloxUsers.json';
        if (fs.existsSync(robloxPath)) {
            const users = JSON.parse(fs.readFileSync(robloxPath));
            if (users[targetUser.id]) {
                robloxName = users[targetUser.id];
                robloxUrl = `https://www.roblox.com/user.aspx?username=${encodeURIComponent(robloxName)}`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`📄 Perfil de ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor('#5865F2')
            .addFields(
                { name: '🆔 ID', value: targetUser.id, inline: true },
                { name: '📅 Se unió', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🤖 Es bot', value: targetUser.bot ? 'Sí' : 'No', inline: true },
                { name: '🎮 Roblox', value: robloxName !== 'No asociado' ? `[${robloxName}](${robloxUrl})` : robloxName, inline: false }
            )
            .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
            .setTimestamp();

        // Roles (máximo 10)
        const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString());
        const rolesText = roles.length ? roles.slice(0, 10).join(', ') + (roles.length > 10 ? '...' : '') : 'Ninguno';
        embed.addFields({ name: '👑 Roles', value: rolesText, inline: false });

        // Botón para ver perfil de Roblox si existe
        const row = new ActionRowBuilder();
        if (robloxUrl) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Ver perfil de Roblox')
                    .setStyle(ButtonStyle.Link)
                    .setURL(robloxUrl)
            );
        }

        await interaction.reply({ embeds: [embed], components: row.components.length ? [row] : [] });
    }
};
