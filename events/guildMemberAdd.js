const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        if (!fs.existsSync('./data/config.json')) return;
        const config = JSON.parse(fs.readFileSync('./data/config.json'));

        // Asignar rol no verificado
        if (config.verify?.noVerificado) {
            const role = member.guild.roles.cache.get(config.verify.noVerificado);
            if (role) await member.roles.add(role).catch(() => {});
        }

        // Asignar roles de bienvenida
        if (config.welcome?.roles?.length) {
            for (const roleId of config.welcome.roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) await member.roles.add(role).catch(() => {});
            }
        }

        // Embed de bienvenida en canal
        if (config.welcome?.canal) {
            const channel = member.guild.channels.cache.get(config.welcome.canal);
            if (channel) {
                const mensajeBase = config.welcome.mensaje || '¡Bienvenido a {server}, {user}!';
                const mensaje = mensajeBase
                    .replace(/{user}/g, '<@' + member.id + '>')
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{count}/g, member.guild.memberCount);

                const embed = new EmbedBuilder()
                    .setTitle('🎉 ¡Bienvenido/a al servidor!')
                    .setDescription(mensaje)
                    .setColor(config.welcome.color || '#57F287')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .addFields(
                        { name: '👤 Usuario', value: member.user.tag, inline: true },
                        { name: '📅 Cuenta creada', value: '<t:' + Math.floor(member.user.createdTimestamp / 1000) + ':R>', inline: true },
                        { name: '👥 Miembro numero', value: '#' + member.guild.memberCount, inline: true }
                    )
                    .setFooter({ text: member.guild.name + ' • Bienvenido/a' });

                if (config.welcome.imagen) embed.setImage(config.welcome.imagen);

                await channel.send({ embeds: [embed] });
            }
        }

        // DM de bienvenida
        if (config.welcome?.mensajeDM) {
            try {
                const dm = await member.user.createDM();
                const dmMensaje = config.welcome.mensajeDM
                    .replace(/{user}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('👋 Bienvenido/a a ' + member.guild.name)
                    .setDescription(dmMensaje)
                    .setColor(config.welcome.color || '#57F287')
                    .setThumbnail(member.guild.iconURL({ dynamic: true }))
                    .setTimestamp();
                await dm.send({ embeds: [dmEmbed] });
            } catch (e) {}
        }
    }
};
