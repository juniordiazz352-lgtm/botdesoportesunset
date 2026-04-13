const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { Ticket } = require('../utils/database');

// Contadores para numeración automática (persistencia en JSON)
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

// Función para obtener estilo de botón
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
        // 🎨 PANEL DE TICKETS PERSONALIZADO (MODAL)
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
        // 🎫 CREAR TICKET (DESDE MODAL)
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

            // Crear canal
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

            // Guardar ticket en MongoDB
            const newTicket = new Ticket({
                ticketId: ticketId,
                category: category,
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                channelId: channel.id,
                status: 'open',
                priority: 'media',
                createdAt: new Date(),
                rating: null
            });
            await newTicket.save();

            // Embed de bienvenida
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

            // Log en canal de logs
            const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🎫 Ticket Creado')
                    .setColor('#00ff00')
                    .addFields(
                        { name: 'ID', value: ticketId, inline: true },
                        { name: 'Categoría', value: category, inline: true },
                        { name: 'Usuario', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Canal', value: `<#${channel.id}>`, inline: true }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] });
            }
            return;
        }

        // ============================================
        // 📝 CREAR FORMULARIO (MODAL)
        // ============================================
        if (interaction.customId === 'crear_form_modal') {
            const nombre = interaction.fields.getTextInputValue('nombre');
            const formsPath = './data/forms.json';
            let forms = {};
            if (fs.existsSync(formsPath)) {
                forms = JSON.parse(fs.readFileSync(formsPath));
            }
            forms[nombre] = {
                nombre: nombre,
                creadoPor: interaction.user.id,
                creadoEn: Date.now()
            };
            fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2));
            await interaction.reply({ content: `✅ Formulario "${nombre}" creado.`, ephemeral: true });
            return;
        }

    } catch (error) {
        console.error('❌ Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar el formulario.', ephemeral: true });
        }
    }
};

        // ============================================
        // PANEL DE FORMULARIOS PERSONALIZADO
        // ============================================
        if (interaction.customId === 'panel_form_selector') {
            const raw = interaction.fields.getTextInputValue('form_list');
            // Separar por comas y limpiar espacios
            let selectedNames = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
            // Eliminar duplicados
            selectedNames = [...new Set(selectedNames)];

            const formsPath = './data/forms.json';
            if (!fs.existsSync(formsPath)) {
                return interaction.reply({ content: '❌ No hay formularios.', ephemeral: true });
            }
            const forms = JSON.parse(fs.readFileSync(formsPath));
            const existingNames = Object.keys(forms);
            const validNames = selectedNames.filter(name => existingNames.includes(name));
            const invalidNames = selectedNames.filter(name => !existingNames.includes(name));

            if (validNames.length === 0) {
                return interaction.reply({ content: '❌ Ninguno de los formularios especificados existe.', ephemeral: true });
            }

            // Crear menú desplegable solo con los válidos
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('form_select')
                .setPlaceholder('Selecciona un formulario')
                .addOptions(
                    validNames.map(name => ({
                        label: name,
                        value: name,
                        description: `Formulario: ${name}`
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);
            const embed = new EmbedBuilder()
                .setTitle('📋 Panel de Formularios')
                .setDescription('Selecciona un formulario para comenzar. Recibirás las preguntas por mensaje directo.')
                .setColor('#00aaff')
                .setFooter({ text: 'Sistema de formularios' })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed], components: [row] });
            let replyMsg = `✅ Panel creado con los formularios: ${validNames.join(', ')}`;
            if (invalidNames.length) {
                replyMsg += `\n⚠️ Los siguientes no existen y se ignoraron: ${invalidNames.join(', ')}`;
            }
            await interaction.reply({ content: replyMsg, ephemeral: true });
            return;
        }
