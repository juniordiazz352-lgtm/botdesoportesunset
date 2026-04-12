const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        if (!fs.existsSync('./data/config.json')) return;
        const config = JSON.parse(fs.readFileSync('./data/config.json'));
        if (!config.goodbye) return;

        const channel = member.guild.channels.cache.get(config.goodbye.canal);
        if (channel) {
            let mensaje = config.goodbye.mensaje.replace(/{user}/g, member.user.tag);
            const embed = new EmbedBuilder()
                .setTitle('👋 Miembro abandonó')
                .setDescription(mensaje)
                .setColor('#ff0000')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Ahora somos ${member.guild.memberCount} miembros` })
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }
    }
};
