const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // ============================================
        // !say - Repite el mensaje
        // ============================================
        if (message.content.startsWith('!say')) {
            const text = message.content.slice(5).trim();
            if (!text) {
                await message.reply('❌ Escribe algo después de !say');
            } else {
                await message.channel.send(text);
            }
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !embed - Crea un embed
        // ============================================
        if (message.content.startsWith('!embed')) {
            const content = message.content.slice(7).trim();
            const separatorIndex = content.indexOf('|');
            
            let title, description;
            if (separatorIndex === -1) {
                title = '📢 Anuncio';
                description = content;
            } else {
                title = content.slice(0, separatorIndex).trim();
                description = content.slice(separatorIndex + 1).trim();
            }
            
            const embed = new EmbedBuilder()
                .setTitle(title || '📢 Anuncio')
                .setDescription(description || 'Sin descripción')
                .setColor('#5865F2')
                .setFooter({ text: `Creado por ${message.author.tag}` })
                .setTimestamp();
            
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !ping - Latencia
        // ============================================
        if (message.content === '!ping') {
            const ping = Math.round(message.client.ws.ping);
            await message.reply(`🏓 Pong! Latencia: ${ping}ms`);
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !info - Información del bot
        // ============================================
        if (message.content === '!info') {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Información del Bot')
                .setDescription('Bot de soporte profesional con sistema de tickets')
                .setColor('#00ff00')
                .addFields(
                    { name: '📡 Ping', value: `${Math.round(message.client.ws.ping)}ms`, inline: true },
                    { name: '💾 Memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '📅 Uptime', value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true }
                )
                .setFooter({ text: 'Bot de Soporte PRO' })
                .setTimestamp();
            
            await message.channel.send({ embeds: [embed] });
            await message.delete().catch(() => {});
            return;
        }

        // ============================================
        // !tickets - Ver tickets del usuario
        // ============================================
        if (message.content === '!tickets') {
            const ticketsPath = './data/tickets.json';
            if (fs.existsSync(ticketsPath)) {
                const tickets = JSON.parse(fs.readFileSync(ticketsPath));
                const userTickets = Object.values(tickets).filter(t => t.userId === message.author.id && t.status !== 'closed');
                
                if (userTickets.length === 0) {
                    await message.reply('📭 No tienes tickets abiertos');
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('🎫 Tus Tickets Abiertos')
                        .setColor('#5865F2');
                    
                    userTickets.forEach(t => {
                        embed.addFields({ name: t.category || 'Ticket', value: `ID: ${t.id}\nCanal: <#${t.channelId}>`, inline: true });
                    });
                    
                    await message.channel.send({ embeds: [embed] });
                }
            } else {
                await message.reply('📭 No hay tickets registrados');
            }
            await message.delete().catch(() => {});
            return;
        }

        // Aquí puedes agregar más comandos ! si quieres
    }
};

        // ============================================
        // MODERACIÓN SOLO STAFF (requiere rol staff)
        // ============================================
        
        // Cargar configuración para verificar rol staff
        const configPath = './data/config.json';
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath));
        }
        const isStaff = message.member.roles.cache.has(config.rol_staff);
        if (!isStaff) return; // Si no es staff, ignora el resto de comandos de moderación

        // !kick @usuario [razón]
        if (message.content.startsWith('!kick')) {
            const args = message.content.split(' ');
            const user = message.mentions.members.first();
            if (!user) return message.reply('❌ Menciona al usuario');
            const reason = args.slice(2).join(' ') || 'Sin razón';
            if (!user.kickable) return message.reply('❌ No puedo kickear a ese usuario');
            await user.kick(reason);
            await message.channel.send(`✅ ${user.user.tag} ha sido kickeado. Razón: ${reason}`);
            await message.delete();
            return;
        }

        // !ban @usuario [razón]
        if (message.content.startsWith('!ban')) {
            const args = message.content.split(' ');
            const user = message.mentions.members.first();
            if (!user) return message.reply('❌ Menciona al usuario');
            const reason = args.slice(2).join(' ') || 'Sin razón';
            if (!user.bannable) return message.reply('❌ No puedo banear a ese usuario');
            await user.ban({ reason });
            await message.channel.send(`✅ ${user.user.tag} ha sido baneado. Razón: ${reason}`);
            await message.delete();
            return;
        }

        // !mute @usuario [tiempo en minutos] [razón]
        if (message.content.startsWith('!mute')) {
            const args = message.content.split(' ');
            const user = message.mentions.members.first();
            if (!user) return message.reply('❌ Menciona al usuario');
            let duration = parseInt(args[2]);
            if (isNaN(duration)) duration = 60; // por defecto 60 minutos
            const reason = args.slice(3).join(' ') || 'Sin razón';
            const timeMs = duration * 60 * 1000;
            if (timeMs > 28 * 24 * 60 * 60 * 1000) return message.reply('❌ El tiempo máximo es 28 días');
            await user.timeout(timeMs, reason);
            await message.channel.send(`✅ ${user.user.tag} muteado por ${duration} minutos. Razón: ${reason}`);
            await message.delete();
            return;
        }

        // !unmute @usuario
        if (message.content.startsWith('!unmute')) {
            const user = message.mentions.members.first();
            if (!user) return message.reply('❌ Menciona al usuario');
            await user.timeout(null);
            await message.channel.send(`✅ ${user.user.tag} ha sido desmuteado.`);
            await message.delete();
            return;
        }

        // !purge [cantidad]
        if (message.content.startsWith('!purge')) {
            const args = message.content.split(' ');
            let amount = parseInt(args[1]);
            if (isNaN(amount) || amount < 1) amount = 10;
            if (amount > 100) amount = 100;
            const fetched = await message.channel.messages.fetch({ limit: amount });
            await message.channel.bulkDelete(fetched, true);
            const msg = await message.channel.send(`🗑️ Se borraron ${fetched.size} mensajes.`);
            setTimeout(() => msg.delete(), 3000);
            await message.delete();
            return;
        }

        // !lockdown (bloquear canal)
        if (message.content.startsWith('!lockdown')) {
            await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
            await message.channel.send('🔒 Canal bloqueado. Solo staff puede enviar mensajes.');
            await message.delete();
            return;
        }

        // !unlock (desbloquear canal)
        if (message.content.startsWith('!unlock')) {
            await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: null });
            await message.channel.send('🔓 Canal desbloqueado.');
            await message.delete();
            return;
        }
