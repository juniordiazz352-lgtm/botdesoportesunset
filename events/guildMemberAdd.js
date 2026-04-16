const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        if (!fs.existsSync('./data/config.json')) return;
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!config.welcome) return;

        // Asignar roles de bienvenida
        if (config.welcome.roles && config.welcome.roles.length) {
            for (const roleId of config.welcome.roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) await member.roles.add(role).catch(() => {});
            }
        }

        // Canal de bienvenida
        const channel = member.guild.channels.cache.get(config.welcome.canal);
        if (!channel) return;

        // Estadísticas del servidor
        const totalMembers = member.guild.memberCount;
        const humanCount = member.guild.members.cache.filter(m => !m.user.bot).size;
        const botCount = member.guild.members.cache.filter(m => m.user.bot).size;
        const boosterCount = member.guild.premiumSubscriptionCount || 0;

        // Mensaje personalizado con variables
        let mensaje = config.welcome.mensaje
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, totalMembers);

        // Embed PRO
        const embed = new EmbedBuilder()
            .setColor(config.welcome.color || '#00ff00')
            .setTitle(`🎉 ¡Bienvenido a ${member.guild.name}! 🎉`)
            .setDescription(mensaje)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage(config.welcome.imagen || null)
            .addFields(
                { name: '👤 Miembro', value: `${member.user.tag}`, inline: true },
                { name: '📅 Miembro #', value: `${totalMembers}`, inline: true },
                { name: '🤖 Bots', value: `${botCount}`, inline: true },
                { name: '👥 Humanos', value: `${humanCount}`, inline: true },
                { name: '💪 Boosts', value: `${boosterCount}`, inline: true },
                { name: '📅 Cuenta creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `ID: ${member.id} • Esperamos que disfrutes tu estancia` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
};
