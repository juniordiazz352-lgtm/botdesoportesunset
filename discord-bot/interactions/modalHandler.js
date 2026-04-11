const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const { canCreateTicket, registerTicket } = require('../utils/dataManager');
const { generateTicketName } = require('../utils/ticketUtils');

const configPath = path.join(__dirname, '../data/config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : {};

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {

        // ======================================================
        // 🎟️ CREACIÓN DE TICKETS (DESDE MODAL)
        // ======================================================
        if (interaction.customId.startsWith('ticket_modal_')) {

            const categoria = interaction.customId.split('_')[2] || 'general';

            // 🔒 Anti-spam
            const check = canCreateTicket(interaction.user.id);
            if (!check.allowed) {
                return interaction.reply({
                    content: `❌ ${check.reason}`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;

            // 📂 Crear nombre del ticket
            const channelName = generateTicketName(categoria);

            // 🧱 Crear canal
            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: config.categoria_tickets || null,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ],
                    },
                    {
                        id: config.rol_staff,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels
                        ],
                    }
                ],
            });

            // 🧠 Guardar datos en el topic (logs pro)
            const startTime = Date.now();
            await channel.setTopic(`owner:${interaction.user.id}|start:${startTime}`);

            // 💾 Registrar ticket (anti-spam)
            registerTicket(interaction.user.id, channel.id);

            // 📩 Respuesta al usuario
            await interaction.editReply(`✅ Ticket creado: ${channel}`);

            // 📢 Embed dentro del ticket
            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket abierto')
                .setDescription(`Hola ${interaction.user}, un staff te atenderá pronto.\n\n📂 Categoría: **${categoria}**`)
                .setColor('#2b2d31')
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('👤 Reclamar')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Cerrar')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
                components: [row]
            });

            // 📊 LOGS
            const logsChannel = guild.channels.cache.get(config.canal_logs);
const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const { canCreateTicket, registerTicket } = require('../utils/dataManager');
const { generateTicketName } = require('../utils/ticketUtils');

const configPath = path.join(__dirname, '../data/config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : {};

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {

        // ======================================================
        // 🎟️ CREACIÓN DE TICKETS (DESDE MODAL)
        // ======================================================
        if (interaction.customId.startsWith('ticket_modal_')) {

            const categoria = interaction.customId.split('_')[2] || 'general';

            // 🔒 Anti-spam
            const check = canCreateTicket(interaction.user.id);
            if (!check.allowed) {
                return interaction.reply({
                    content: `❌ ${check.reason}`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;

            // 📂 Crear nombre del ticket
            const channelName = generateTicketName(categoria);

            // 🧱 Crear canal
            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: config.categoria_tickets || null,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ],
                    },
                    {
                        id: config.rol_staff,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels
                        ],
                    }
                ],
            });

            // 🧠 Guardar datos en el topic (logs pro)
            const startTime = Date.now();
            await channel.setTopic(`owner:${interaction.user.id}|start:${startTime}`);

            // 💾 Registrar ticket (anti-spam)
            registerTicket(interaction.user.id, channel.id);

            // 📩 Respuesta al usuario
            await interaction.editReply(`✅ Ticket creado: ${channel}`);

            // 📢 Embed dentro del ticket
            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket abierto')
                .setDescription(`Hola ${interaction.user}, un staff te atenderá pronto.\n\n📂 Categoría: **${categoria}**`)
                .setColor('#2b2d31')
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('👤 Reclamar')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Cerrar')
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
                components: [row]
            });

            // 📊 LOGS
            const logsChannel = guild.channels.cache.get(config.canal_logs);
            if (logsChannel) {
                await logsChannel.send({
                    content: `📊 Ticket creado\n👤 Usuario: ${interaction.user}\n📂 Categoría: ${categoria}\n📁 Canal: ${channel}`
                });
            }
        }

        // ======================================================
        // 🧾 CONFIG PANEL TICKETS (SI USAS MODAL PANEL)
        // ======================================================
        if (interaction.customId === 'panel_ticket_config') {

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color') || '#2b2d31';

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_general')
                    .setLabel('🎫 Crear Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }

    } catch (error) {
        console.error('❌ Error en modalHandler:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Ocurrió un error procesando el formulario.',
                ephemeral: true
            });
        }
    }
};
