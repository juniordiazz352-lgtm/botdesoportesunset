const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        let config = {};
        if (fs.existsSync('./data/config.json')) {
            config = JSON.parse(fs.readFileSync('./data/config.json'));
        }

        // Asignar múltiples roles de bienvenida
        if (config.welcome && config.welcome.roles && config.welcome.roles.length) {
            for (const roleId of config.welcome.roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) {
                    await member.roles.add(role).catch(err => console.error(`Error al asignar rol ${roleId}:`, err));
                }
            }
        }

        // Asignar rol "no verificado" si existe (para verificación)
        if (config.verify && config.verify.noVerificado) {
            const role = member.guild.roles.cache.get(config.verify.noVerificado);
            if (role) {
                await member.roles.add(role).catch(err => console.error('Error al asignar rol no verificado:', err));
            }
        }

        // Enviar mensaje de bienvenida
        if (config.welcome && config.welcome.canal) {
            const channel = member.guild.channels.cache.get(config.welcome.canal);
            if (channel) {
                let mensaje = config.welcome.mensaje.replace(/{user}/g, `<@${member.id}>`);
                const embed = new EmbedBuilder()
                    .setTitle('🎉 ¡Bienvenido!')
                    .setDescription(mensaje)
                    .setColor('#00ff00')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setImage(config.welcome.imagen)
                    .setFooter({ text: `Miembro #${member.guild.memberCount}` })
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }
        }
    }
};
