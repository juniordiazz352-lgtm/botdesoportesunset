const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        if (!fs.existsSync('./data/config.json')) return;
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!config.welcome) return;

        // Asignar roles de bienvenida (si existen)
        if (config.welcome.roles && config.welcome.roles.length) {
            for (const roleId of config.welcome.roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) await member.roles.add(role).catch(() => {});
            }
        }

        // Canal de bienvenida
        const channel = member.guild.channels.cache.get(config.welcome.canal);
        if (!channel) return;

        // Reemplazar variables en el mensaje
        let mensaje = config.welcome.mensaje
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{server}/g, member.guild.name)
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{membercount}/g, member.guild.memberCount);

        // Embed profesional
        const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setTitle('🎉 ¡Nuevo miembro!')
            .setDescription(mensaje)
            .setColor('#00ff00')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setImage(config.welcome.imagen || 'https://i.imgur.com/6Y6H7Qv.png') // Imagen de fondo por defecto
            .addFields(
                { name: '📅 Cuenta creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👥 Miembro número', value: `#${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: `ID: ${member.id}`, iconURL: member.guild.iconURL() })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
};
