const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

// Contadores por categoría
let ticketCounters = {};

function loadCounters() {
    if (fs.existsSync('./data/counters.json')) {
        ticketCounters = JSON.parse(fs.readFileSync('./data/counters.json'));
    }
}

function saveCounters() {
    fs.writeFileSync('./data/counters.json', JSON.stringify(ticketCounters, null, 2));
}

function getNextTicketNumber(category) {
    if (!ticketCounters[category]) ticketCounters[category] = 0;
    ticketCounters[category]++;
    saveCounters();
    return String(ticketCounters[category]).padStart(4, '0');
}

function getButtonStyle(color) {
    const colors = {
        'primary': ButtonStyle.Primary,
        'secondary': ButtonStyle.Secondary,
        'success': ButtonStyle.Success,
        'danger': ButtonStyle.Danger,
    };
    return colors[color.toLowerCase()] || ButtonStyle.Primary;
}

module.exports = async (interaction) => {
    try {
        loadCounters();
        
        // ============================================
        // 🎨 PANEL DE TICKETS PERSONALIZADO
        // ============================================
        if (interaction.customId === 'panel_ticket_modal') {
            await interaction.deferReply({ ephemeral: true });
            
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('descripcion');
            let color = interaction.fields.getTextInputValue('color') || '#5865F2';
            const botonesRaw = interaction.fields.getTextInputValue('botones');
            
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#5865F2';
            
            const lineas = botonesRaw.split('\n');
            const botones = [];
            
            for (const linea of lineas) {
                const partes = linea.split('|');
                if (partes.length >= 1 && partes[0].trim()) {
                    botones.push({
                        nombre: partes[0].trim(),
                        emoji: partes[1] ? partes[1].trim() : '🎫',
                        color: partes[2] ? partes[2].trim().toLowerCase() : 'primary'
                    });
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(desc)
                .setColor(color)
                .setFooter({ text: `📅 ${new Date().toLocaleString()}` })
                .setTimestamp();
            
            const row = new ActionRowBuilder();
            
            for (const btn of botones) {
                const button = new ButtonBuilder()
                    .setCustomId(`create_ticket_${btn.nombre.toLowerCase().replace(/\s/g, '_')}`)
                    .setLabel(btn.nombre)
                    .setStyle(getButtonStyle(btn.color));
                
                if (btn.emoji && btn.emoji !== '🎫') button.setEmoji(btn.emoji);
                row.addComponents(button);
            }
            
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: `✅ Panel creado con ${botones.length} botones` });
            return;
        }
        
        // ============================================
        // 🎫 CREAR TICKET CON NUMERACIÓN AUTOMÁTICA
        // ============================================
        if (interaction.customId.startsWith('ticket_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            
            const configPath = './data/config.json';
            let config = {};
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath));
            }
            
            const category = interaction.customId.replace('ticket_modal_', '');
            const motivo = interaction.fields.getTextInputValue('motivo');
            const ticketNumber = getNextTicketNumber(category);
            const ticketId = `${category}-${ticketNumber}`;
            
            const channel = await interaction.guild.channels.create({
                name: `ticket-${ticketId}`,
                type: ChannelType.GuildText,
                parent: config.categoria_tickets || null,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                ]
            });
            
            if (config.rol_staff) {
                await channel.permissionOverwrites.edit(config.rol_staff, {
                    ViewChannel: true, SendMessages: true, ReadMessageHistory: true
                });
            }
            
            // Guardar información del ticket
            const ticketsPath = './data/tickets.json';
            let tickets = {};
            if (fs.existsSync(ticketsPath)) {
                tickets = JSON.parse(fs.readFileSync(ticketsPath));
            }
            
            tickets[channel.id] = {
                id: ticketId,
                category: category,
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                channelId: channel.id,
                status: 'open',
                createdAt: Date.now(),
                createdAtStr: new Date().toLocaleString(),
                claimedBy: null,
                claimedAt: null,
                closedBy: null,
                closedAt: null
            };
            
            fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
            
            const embed = new EmbedBuilder()
                .setTitle(`🎫 Ticket ${ticketId}`)
                .setDescription(`**Categoría:** ${category}\n**Motivo:**\n${motivo}`)
                .setColor('#5865F2')
                .setFooter({ text: `ID: ${ticketId} | Usuario: ${interaction.user.tag}` })
                .setTimestamp();
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setEmoji('👤').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setEmoji('📄').setStyle(ButtonStyle.Secondary)
            );
            
            await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
            await interaction.editReply({ content: `✅ Ticket ${ticketId} creado: ${channel}` });
            return;
        }
    } catch (error) {
        console.error('❌ Error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error', ephemeral: true });
        }
    }
};
