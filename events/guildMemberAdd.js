const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Canvas = require('canvas');
const fs = require('fs');
const { registerFont } = require('canvas');
// Registrar fuente si quieres (opcional)
// registerFont('./ruta/fuente.ttf', { family: 'MiFuente' });

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const configPath = './data/welcome.json';
        if (!fs.existsSync(configPath)) return;
        const config = JSON.parse(fs.readFileSync(configPath));
        const channel = member.guild.channels.cache.get(config.welcomeChannel);
        if (!channel) return;

        // Crear lienzo
        const canvas = Canvas.createCanvas(1024, 500);
        const ctx = canvas.getContext('2d');

        // Fondo (color o imagen)
        if (config.welcomeImage) {
            try {
                const background = await Canvas.loadImage(config.welcomeImage);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            } catch (e) {
                ctx.fillStyle = '#2c2f33';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            ctx.fillStyle = '#2c2f33';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Círculo con foto de perfil
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await Canvas.loadImage(avatarURL);
        const radius = 150;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 50;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();

        // Borde del círculo
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Texto del nombre
        ctx.font = 'bold 42px "Segoe UI"';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(member.user.username, centerX - ctx.measureText(member.user.username).width / 2, centerY + radius + 60);

        // Mensaje personalizado
        let messageText = config.welcomeMessage.replace('{user}', member.user.tag).replace('{server}', member.guild.name);
        ctx.font = '28px "Segoe UI"';
        ctx.fillStyle = '#dddddd';
        ctx.fillText(messageText, centerX - ctx.measureText(messageText).width / 2, centerY + radius + 120);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
        const embed = new EmbedBuilder()
            .setTitle(`🎉 ¡Bienvenido ${member.user.username}!`)
            .setImage('attachment://welcome.png')
            .setColor('#00ff00')
            .setDescription(messageText)
            .setTimestamp();
        await channel.send({ embeds: [embed], files: [attachment] });
    }
};
