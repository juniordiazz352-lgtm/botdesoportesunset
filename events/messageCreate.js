module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;
        
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5);
            if (text) await message.channel.send(text);
            await message.delete().catch(() => {});
        }
        
        if (message.content.startsWith('!embed')) {
            const args = message.content.slice(7).split('|');
            const title = args[0] || 'Anuncio';
            const desc = args[1] || 'Sin descripción';
            
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(desc)
                .setColor('#5865F2')
                .setFooter({ text: `Creado por ${message.author.tag}` })
                .setTimestamp();
            
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
        }
    }
};
