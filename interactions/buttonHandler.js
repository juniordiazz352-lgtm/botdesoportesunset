const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { Ticket, StaffStat } = require('../utils/database');

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
            // Verificar que sea un ticket
            const ticketDoc = await Ticket.findOne({ channelId: interaction.channel.id });
            if (!ticketDoc) {
                return interaction.reply({ content: '❌ Este no es un ticket válido.', ephemeral: true });
            }

            // Verificar staff
            if (!interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({ content: '❌ Solo staff puede reclamar.', ephemeral: true });
            }

            // Actualizar en MongoDB
            ticketDoc.claimedBy = interaction.user.id;
            ticketDoc.claimedAt = new Date();
            await ticketDoc.save();

            // Actualizar estadísticas del staff
            await StaffStat.findOneAndUpdate(
                { userId: interaction.user.id },
                { $inc: { ticketsReclamados: 1 } },
                { upsert: true, new: true }
            );

            // Cambiar nombre del canal
            await interaction.channel.setName(`reclamado-${interaction.user.username}`);

            await interaction.reply({ content: `👤 Ticket reclamado por ${interaction.user}` });
        }

        // ============================================
        // 🔒 CERRAR TICKET (con estadísticas y valoración)
        // ============================================
        if (interaction.customId === 'ticket_close') {
            // Verificar staff
            if (!interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({ content: '❌ Solo staff puede cerrar tickets.', ephemeral: true });
            }

            await interaction.reply({ content: '🔒 Cerrando ticket en 5 segundos...' });

            const ticketDoc = await Ticket.findOne({ channelId: interaction.channel.id });
            if (ticketDoc) {
                // Calcular duración
                const duracionSeg = Math.floor((Date.now() - new Date(ticketDoc.createdAt).getTime()) / 1000);
                ticketDoc.status = 'closed';
                ticketDoc.closedBy = interaction.user.id;
                ticketDoc.closedAt = new Date();
                ticketDoc.duration = duracionSeg;
                await ticketDoc.save();

                // Actualizar estadísticas del staff que cerró (si es el mismo que reclamó o no)
                await StaffStat.findOneAndUpdate(
                    { userId: interaction.user.id },
                    {
                        $inc: {
                            ticketsResueltos: 1,
                            tiempoTotalSegundos: duracionSeg
                        }
                    },
                    { upsert: true }
                );

                // Enviar log al canal de logs
                const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('📊 Ticket Cerrado')
                        .setColor('#ff0000')
                        .addFields(
                            { name: '🎫 ID', value: ticketDoc.ticketId, inline: true },
                            { name: '📂 Categoría', value: ticketDoc.category, inline: true },
                            { name: '👤 Usuario', value: `<@${ticketDoc.userId}>`, inline: true },
                            { name: '📅 Abierto', value: new Date(ticketDoc.createdAt).toLocaleString(), inline: true },
                            { name: '🔒 Cerrado por', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '⏱ Duración', value: `${Math.floor(duracionSeg / 60)}m ${duracionSeg % 60}s`, inline: true },
                            { name: '👥 Reclamado por', value: ticketDoc.claimedBy ? `<@${ticketDoc.claimedBy}>` : 'Nadie', inline: true }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] });
                }

                // Enviar DM al usuario con valoración
                try {
                    const user = await interaction.client.users.fetch(ticketDoc.userId);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('🎫 Ticket Cerrado')
                        .setDescription(`Tu ticket **${ticketDoc.ticketId}** ha sido cerrado.`)
                        .setColor('#ff9900')
                        .addFields(
                            { name: '📂 Categoría', value: ticketDoc.category, inline: true },
                            { name: '📅 Fecha apertura', value: new Date(ticketDoc.createdAt).toLocaleString(), inline: true },
                            { name: '🔒 Cerrado por', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '⏱ Duración', value: `${Math.floor(duracionSeg / 60)}m ${duracionSeg % 60}s`, inline: true }
                        )
                        .setFooter({ text: 'Califica tu experiencia con el staff' });

                    const row = new ActionRowBuilder();
                    for (let i = 1; i <= 5; i++) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`rate_${i}_${ticketDoc._id}`)
                                .setLabel(`${i} ⭐`)
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }
                    await user.send({ embeds: [dmEmbed], components: [row] });
                } catch (e) {
                    console.error('No se pudo enviar DM al usuario', e);
                }
            }

            // Eliminar canal después de 5 segundos
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }

        // ============================================
        // ⭐ SISTEMA DE VALORACIÓN (actualiza rating del staff)
        // ============================================
        if (interaction.customId.startsWith('rate_')) {
            const parts = interaction.customId.split('_');
            const rating = parseInt(parts[1]);
            const ticketId = parts[2]; // _id de MongoDB

            const ticketDoc = await Ticket.findById(ticketId);
            if (!ticketDoc) {
                return interaction.reply({ content: '❌ Ticket no encontrado.', ephemeral: true });
            }

            const staffId = ticketDoc.claimedBy;
            if (staffId) {
                await StaffStat.findOneAndUpdate(
                    { userId: staffId },
                    {
                        $inc: { ratingSuma: rating, ratingCantidad: 1 }
                    },
                    { upsert: true }
                );
                // Enviar al canal de feedback
                const feedbackChannel = interaction.guild.channels.cache.get(config.canal_feedback);
                if (feedbackChannel) {
                    await feedbackChannel.send(`⭐ **${interaction.user.tag}** valoró al staff <@${staffId}> con **${rating}/5** estrellas.`);
                }
            }

            await interaction.reply({ content: `✅ Gracias por tu valoración de ${rating}/5 ⭐`, ephemeral: true });
        }

        // ============================================
        // 📄 TRANSCRIPT MANUAL (opcional)
        // ============================================
        if (interaction.customId === 'ticket_transcript') {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let transcript = `📋 TRANSCRIPT - ${interaction.channel.name}\n\n`;
            messages.reverse().forEach(msg => {
                transcript += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
            });
            fs.writeFileSync('./data/transcript.txt', transcript);
            await interaction.reply({ files: ['./data/transcript.txt'], ephemeral: true });
        }

    } catch (error) {
        console.error('❌ Error en buttonHandler:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Error al procesar el botón.', ephemeral: true });
        }
    }
};
