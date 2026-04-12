const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const configPath = './data/goodbye.json';
        if (!fs.existsSync(configPath)) return;
        const config = JSON.parse(fs.readFileSync(configPath));
        const channel = member.guild.channels.cache.get(config.goodbyeChannel);
        if (!channel) return;

        let message = config.goodbyeMessage.replace('{user}', member.user.tag);
        const embed = new EmbedBuilder()
            .setTitle(`👋 ¡Hasta luego ${member.user.username}!`)
            .setDescription(message)
            .setColor('#ff0000')
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        await channel.send({ embeds: [embed] });
    }
};
