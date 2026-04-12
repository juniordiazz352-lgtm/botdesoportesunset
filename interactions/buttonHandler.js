const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    try {
        const configPath = './data/config.json';
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath));
        }
        
        // ============================================
        // 👤 RECLAMAR TICKET
        // ============================================
        if (interaction.customId === 'ticket_claim') {
            const ticketsPath = './data/tickets.json';
            let tickets = JSON.parse(fs.readFileSync(ticketsPath));
            
            if (tickets[interaction.channel.id]) {
                tickets[interaction.channel.id].claimedBy = interaction.user.id;
                tickets[interaction.channel.id].claimedAt = Date.now();
                tickets[interaction.channel.id].claimedAtStr = new Date().toLocaleString();
                fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
            }
            
            await interaction.channel.setName(`reclamado-${interaction.user.username}`);
            await interaction.reply({ content: `👤 Ticket reclamado por ${interaction.user}` });
        }
        
        // ============================================
        // 🔒 CERRAR TICKET CON LOGS Y VALORACIÓN
        // ============================================
        if (interaction.customId === 'ticket_close') {
            await interaction.reply({ content: '🔒 Cerrando ticket en 5 segundos...' });
            
            const ticketsPath = './data/tickets.json';
            let tickets = JSON.parse(fs.readFileSync(ticketsPath));
            const ticketInfo = tickets[interaction.channel.id];
            
            if (ticketInfo) {
                ticketInfo.status = 'closed';
                ticketInfo.closedBy = interaction.user.id;
                ticketInfo.closedByTag = interaction.user.tag;
                ticketInfo.closedAt = Date.now();
                ticketInfo.closedAtStr = new Date().toLocaleString();
                
                // Calcular duración
                const duration = Math.floor((Date.now() - ticketInfo.createdAt) / 1000);
                const hours = Math.floor(duration / 3600);
                const minutes = Math.floor((duration % 3600) / 60);
                const seconds = duration % 60;
                ticketInfo.duration = `${hours}h ${minutes}m ${seconds}s`;
                
                fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
                
                // Enviar log al canal de logs
                const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('📊 Ticket Cerrado')
                        .setColor('#ff0000')
                        .addFields(
                            { name: '🎫 ID', value: ticketInfo.id, inline: true },
                            { name: '📂 Categoría', value: ticketInfo.category, inline: true },
                            { name: '👤 Usuario', value: `<@${ticketInfo.userId}>`, inline: true },
                            { name: '📅 Abierto', value: ticketInfo.createdAtStr, inline: true },
                            { name: '🔒 Cerrado por', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '⏱ Duración', value: ticketInfo.duration, inline: true },
                            { name: '👥 Reclamado por', value: ticketInfo.claimedBy ? `<@${ticketInfo.claimedBy}>` : 'Nadie', inline: true }
                        )
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
                
                // Enviar DM al usuario con información del ticket
                try {
                    const user = await interaction.client.users.fetch(ticketInfo.userId);
                    
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('🎫 Ticket Cerrado')
                        .setDescription(`Tu ticket **${ticketInfo.id}** ha sido cerrado`)
                        .setColor('#ff9900')
                        .addFields(
                            { name: '📂 Categoría', value: ticketInfo.category, inline: true },
                            { name: '📅 Fecha apertura', value: ticketInfo.createdAtStr, inline: true },
                            { name: '🔒 Cerrado por', value: ticketInfo.closedByTag, inline: true },
                            { name: '⏱ Duración', value: ticketInfo.duration, inline: true },
                            { name: '👥 Atendido por', value: ticketInfo.claimedBy ? `<@${ticketInfo.claimedBy}>` : 'Nadie', inline: true }
                        )
                        .setFooter({ text: 'Gracias por usar nuestro soporte' });
                    
                    // Botones de valoración
                    const row = new ActionRowBuilder();
                    for (let i = 1; i <= 5; i++) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`rate_${i}_${ticketInfo.id}`)
                                .setLabel(`${i} ⭐`)
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }
                    
                    await user.send({ embeds: [dmEmbed], components: [row] });
                } catch(e) { console.error('No se pudo enviar DM'); }
            }
            
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
        
        // ============================================
        // ⭐ SISTEMA DE VALORACIÓN
        // ============================================
        if (interaction.customId.startsWith('rate_')) {
            const parts = interaction.customId.split('_');
            const rating = parts[1];
            const ticketId = parts[2];
            
            const feedbackChannel = interaction.guild.channels.cache.get(config.canal_feedback);
            if (feedbackChannel) {
                const feedbackEmbed = new EmbedBuilder()
                    .setTitle('⭐ Nueva Valoración')
                    .setDescription(`**Ticket:** ${ticketId}\n**Puntuación:** ${rating}/5 ⭐\n**Usuario:** ${interaction.user.tag}`)
                    .setColor('#00ff00')
                    .setTimestamp();
                
                await feedbackChannel.send({ embeds: [feedbackEmbed] });
            }
            
            await interaction.reply({ content: `✅ Gracias por tu valoración de ${rating}/5 ⭐`, ephemeral: true });
        }
        
        // ============================================
        // 📄 TRANSCRIPT
        // ============================================
        if (interaction.customId === 'ticket_transcript') {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let transcript = `📋 TRANSCRIPT - ${interaction.channel.name}\n\n`;
            messages.reverse().forEach(msg => {
                transcript += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
            });
            
            const fs = require('fs');
            fs.writeFileSync('./data/transcript.txt', transcript);
            await interaction.reply({ files: ['./data/transcript.txt'], ephemeral: true });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
};
