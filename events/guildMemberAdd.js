const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        if (!fs.existsSync('./data/config.json')) return;
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        
        // 1. Asignar rol "no verificado" si está configurado en setup-verify
        if (config.verify && config.verify.noVerificado) {
            const role = member.guild.roles.cache.get(config.verify.noVerificado);
            if (role) await member.roles.add(role).catch(() => {});
        }
        
        // 2. Asignar roles de bienvenida (múltiples) si existen en welcome
        if (config.welcome && config.welcome.roles && config.welcome.roles.length) {
            for (const roleId of config.welcome.roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) await member.roles.add(role).catch(() => {});
            }
        }

        // 3. Enviar embed de bienvenida al canal configurado
        if (config.welcome && config.welcome.canal) {
            const channel = member.guild.channels.cache.get(config.welcome.canal);
            if (channel) {
                let mensaje = config.welcome.mensaje.replace(/{user}/g, `<@${member.id}>`).replace(/{server}/g, member.guild.name);
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
