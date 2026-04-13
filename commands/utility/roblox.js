const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

async function getRobloxUser(username) {
    try {
        const res = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`);
        const data = await res.json();
        if (!data.data || data.data.length === 0) return null;
        const user = data.data[0];
        const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png`);
        const avatarData = await avatarRes.json();
        const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
        const socialRes = await fetch(`https://friends.roblox.com/v1/users/${user.id}/followers/count`);
        const followersData = await socialRes.json();
        const followers = followersData.count || 0;
        const friendsRes = await fetch(`https://friends.roblox.com/v1/users/${user.id}/friends/count`);
        const friendsData = await friendsRes.json();
        const friends = friendsData.count || 0;
        return {
            id: user.id,
            name: user.name,
            displayName: user.displayName,
            created: user.created,
            avatarUrl: avatarUrl,
            followers: followers,
            friends: friends,
            profileUrl: `https://www.roblox.com/users/${user.id}/profile`
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roblox')
        .setDescription('Muestra el perfil de Roblox de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario de Discord (opcional)').setRequired(false))
        .addStringOption(opt => opt.setName('nombre').setDescription('Nombre de usuario de Roblox (opcional)').setRequired(false)),

    async execute(interaction) {
        // Aplazar la respuesta porque la API de Roblox puede ser lenta
        await interaction.deferReply();

        const discordUser = interaction.options.getUser('usuario');
        const robloxNameInput = interaction.options.getString('nombre');
        let robloxUsername = null;

        if (robloxNameInput) {
            robloxUsername = robloxNameInput;
        } else if (discordUser) {
            const robloxUsersPath = './data/robloxUsers.json';
            if (fs.existsSync(robloxUsersPath)) {
                const users = JSON.parse(fs.readFileSync(robloxUsersPath));
                robloxUsername = users[discordUser.id];
            }
            if (!robloxUsername) {
                return interaction.editReply({ content: `❌ ${discordUser.tag} no tiene un usuario de Roblox asociado.` });
            }
        } else {
            const robloxUsersPath = './data/robloxUsers.json';
            if (fs.existsSync(robloxUsersPath)) {
                const users = JSON.parse(fs.readFileSync(robloxUsersPath));
                robloxUsername = users[interaction.user.id];
            }
            if (!robloxUsername) {
                return interaction.editReply({ content: '❌ No tienes un usuario de Roblox asociado. Usa `/roblox nombre:tu_usuario` para asociarlo.' });
            }
        }

        const robloxData = await getRobloxUser(robloxUsername);
        if (!robloxData) {
            return interaction.editReply({ content: `❌ No se encontró el usuario de Roblox: **${robloxUsername}**` });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎮 Perfil de Roblox: ${robloxData.name}`)
            .setURL(robloxData.profileUrl)
            .setThumbnail(robloxData.avatarUrl || 'https://www.roblox.com/favicon.ico')
            .setColor('#ff0000')
            .addFields(
                { name: '🆔 ID', value: robloxData.id.toString(), inline: true },
                { name: '📛 Nombre', value: robloxData.name, inline: true },
                { name: '✨ Display Name', value: robloxData.displayName || 'N/A', inline: true },
                { name: '📅 Cuenta creada', value: `<t:${Math.floor(new Date(robloxData.created).getTime() / 1000)}:R>`, inline: true },
                { name: '👥 Seguidores', value: robloxData.followers.toLocaleString(), inline: true },
                { name: '🤝 Amigos', value: robloxData.friends.toLocaleString(), inline: true }
            )
            .setFooter({ text: 'Datos obtenidos de Roblox API' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
