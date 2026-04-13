const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

function getConfig() {
    if (fs.existsSync('./data/config.json')) {
        return JSON.parse(fs.readFileSync('./data/config.json'));
    }
    return {};
}

function getTickets() {
    if (fs.existsSync('./data/tickets.json')) {
        return JSON.parse(fs.readFileSync('./data/tickets.json'));
    }
    return {};
}

function saveTickets(tickets) {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/tickets.json', JSON.stringify(tickets, null, 2));
}

module.exports = async (interaction, client) => {
    try {
        const config = getConfig();

        // ABRIR TICKET DESDE BOTON DEL PANEL
        if (interaction.customId.startsWith('create_ticket_')) {
            const category = interaction.customId.replace('create_ticket_', '');
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId('ticket_modal_' + category)
                .setTitle('Abrir Ticket - ' + category);
            const motivoInput = new TextInputBuilder()
                .setCustomId('motivo')
                .setLabel('Describe tu consulta')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Explica tu problema con detalle...')
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000);
            modal.addComponents(new ActionRowBuilder().addComponents(motivoInput));
            return interaction.showModal(modal);
        }

        // RECLAMAR TICKET
        if (interaction.customId === 'ticket_claim') {
            if (config.rol_staff && !interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({ content: 'Solo staff puede reclamar tickets.', ephemeral: true });
            }
            const tickets = getTickets();
            const ticket = tickets[interaction.channel.id];
            if (!ticket) {
                return interaction.reply({ content: 'Este canal no es un ticket valido.', ephemeral: true });
            }
            if (ticket.claimedBy) {
                return interaction.reply({ content: 'Este ticket ya fue reclamado por <@' + ticket.claimedBy + '>.', ephemeral: true });
            }
            ticket.claimedBy = interaction.user.id;
            ticket.claimedAt = Date.now();
            saveTickets(tickets);
            await interaction.channel.setName('reclamado-' + interaction.user.username.toLowerCase().replace(/\s/g, '-'));
            return interaction.reply({ content: 'Ticket reclamado por ' + interaction.user });
        }

        // CERRAR TICKET
        if (interaction.customId === 'ticket_close') {
            if (config.rol_staff && !interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({ content: 'Solo staff puede cerrar tickets.', ephemeral: true });
            }
            const tickets = getTickets();
            const ticket = tickets[interaction.channel.id];
            await interaction.reply({ content: 'Cerrando ticket en 5 segundos...' });
            if (ticket) {
                const duracionSeg = Math.floor((Date.now() - ticket.createdAt) / 1000);
                const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('Ticket Cerrado')
                        .setColor('#ff0000')
                        .addFields(
                            { name: 'ID', value: ticket.ticketId || interaction.channel.name, inline: true },
                            { name: 'Categoria', value: ticket.category || 'N/A', inline: true },
                            { name: 'Usuario', value: '<@' + ticket.userId + '>', inline: true },
                            { name: 'Cerrado por', value: '<@' + interaction.user.id + '>', inline: true },
                            { name: 'Duracion', value: Math.floor(duracionSeg / 60) + 'm ' + (duracionSeg % 60) + 's', inline: true },
                            { name: 'Reclamado por', value: ticket.claimedBy ? '<@' + ticket.claimedBy + '>' : 'Nadie', inline: true }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] });
                }
                // Enviar DM de valoracion al usuario
                try {
                    const user = await client.users.fetch(ticket.userId);
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('Tu ticket fue cerrado')
                        .setDescription('Ticket **' + (ticket.ticketId || interaction.channel.name) + '** cerrado. Califica la atencion:')
                        .setColor('#ff9900');
                    const row = new ActionRowBuilder();
                    for (let i = 1; i <= 5; i++) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('rate_' + i + '_' + interaction.channel.id)
                                .setLabel(i + ' estrella' + (i > 1 ? 's' : ''))
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }
                    await user.send({ embeds: [dmEmbed], components: [row] });
                } catch (e) {}
                delete tickets[interaction.channel.id];
                saveTickets(tickets);
            }
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
            return;
        }

        // VALORACION
        if (interaction.customId.startsWith('rate_')) {
            const parts = interaction.customId.split('_');
            const rating = parseInt(parts[1]);
            const logChannel = client.guilds.cache.first()?.channels.cache.get(config.canal_logs);
            if (logChannel) {
                await logChannel.send('**' + interaction.user.tag + '** califico la atencion con **' + rating + '/5** estrellas.');
            }
            return interaction.update({ content: 'Gracias por tu valoracion de ' + rating + '/5', components: [] });
        }

        // TRANSCRIPT
        if (interaction.customId === 'ticket_transcript') {
            if (config.rol_staff && !interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({ content: 'Solo staff puede generar transcripts.', ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let transcript = 'TRANSCRIPT - ' + interaction.channel.name + '\n\n';
            messages.reverse().forEach(msg => {
                transcript += '[' + msg.createdAt.toLocaleString() + '] ' + msg.author.tag + ': ' + msg.content + '\n';
            });
            if (!fs.existsSync('./data')) fs.mkdirSync('./data');
            const filename = './data/transcript-' + interaction.channel.name + '.txt';
            fs.writeFileSync(filename, transcript);
            const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
            if (logChannel) await logChannel.send({ content: 'Transcript de ' + interaction.channel.name, files: [filename] });
            return interaction.editReply({ content: 'Transcript guardado y enviado al canal de logs.' });
        }

    } catch (error) {
        console.error('Error en buttonHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Error al procesar el boton.', ephemeral: true });
        }
    }
};
