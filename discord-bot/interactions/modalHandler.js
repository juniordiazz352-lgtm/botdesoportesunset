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

const dataPath = path.join(__dirname, '../data/data.json');
const configPath = path.join(__dirname, '../data/config.json');

function loadData() {
    if (!fs.existsSync(dataPath)) return { tickets: {}, ticketCount: 0 };
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function loadConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath));
}

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {
        if (!interaction.customId.startsWith('ticket_modal_')) return;

        await interaction.deferReply({ ephemeral: true }); // 🔥 CLAVE

        const config = loadConfig();
        const data = loadData();

        const category = interaction.customId.replace('ticket_modal_', '');

        // 🚫 Anti duplicado
        const existing = Object.values(data.tickets).find(
            t => t.userId === interaction.user.id && t.status === 'open'
        );

        if (existing) {
            return interaction.editReply({
                content: '❌ Ya tenés un ticket abierto.'
            });
        }

        data.ticketCount++;
        const id = String(data.ticketCount).padStart(4, '0');

        const channel = await interaction.guild.channels.create({
            name: `ticket-${category}-${id}`,
            type: ChannelType.GuildText,
            parent: config.categoria_tickets || null,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ],
                },
                {
                    id: config.rol_staff,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ],
                }
            ],
        });

        data.tickets[channel.id] = {
            id,
            userId: interaction.user.id,
            category,
            status: 'open',
            createdAt: Date.now()
        };

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle(`🎫 Ticket - ${category}`)
            .setDescription(interaction.fields.getTextInputValue('reason'))
            .setColor('#5865F2');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_claim')
                .setLabel('👤 Reclamar')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('🔒 Cerrar')
                .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [embed],
            components: [row]
        });

        return interaction.editReply({
            content: `✅ Ticket creado: ${channel}`
        });

    } catch (err) {
        console.error('❌ Error modal:', err);

        if (!interaction.replied) {
            interaction.reply({
                content: '❌ Error al crear ticket',
                ephemeral: true
            });
        }
    }
};
// 🎛️ CREAR PANEL DINÁMICO
if (interaction.customId === 'panel_ticket_modal') {

    await interaction.deferReply({ ephemeral: true });

    const title = interaction.fields.getTextInputValue('title');
    const desc = interaction.fields.getTextInputValue('desc');
    const buttonsInput = interaction.fields.getTextInputValue('buttons');

    const categories = buttonsInput.split(',').map(b => b.trim().toLowerCase());

    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#5865F2');

    const row = new ActionRowBuilder();

    categories.forEach(cat => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`create_ticket_${cat}`)
                .setLabel(cat.charAt(0).toUpperCase() + cat.slice(1))
                .setStyle(ButtonStyle.Primary)
        );
    });

    await interaction.channel.send({
        embeds: [embed],
        components: [row]
    });

    return interaction.editReply({
        content: '✅ Panel creado dinámicamente'
    });
}
