const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/data.json');

// ─────────────────────────────────────────────
// 📦 UTILIDADES
// ─────────────────────────────────────────────
function loadData() {
    if (!fs.existsSync(dataPath)) {
        return { tickets: {}, ticketCount: 0 };
    }
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// ─────────────────────────────────────────────
// 🚀 HANDLER
// ─────────────────────────────────────────────
module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {
        const data = loadData();

        // ─────────────────────────────────────────
        // 🎫 CREAR TICKET
        // ─────────────────────────────────────────
        if (interaction.customId.startsWith('ticket_modal_')) {

            const categoryName = interaction.customId.split('_')[2] || 'general';

            // 🚫 Anti-duplicado
            const existing = Object.values(data.tickets).find(
                t => t.userId === interaction.user.id && t.status === 'open'
            );

            if (existing) {
                return interaction.reply({
                    content: '❌ Ya tenés un ticket abierto.',
                    ephemeral: true
                });
            }

            // 📊 Incrementar contador
            data.ticketCount++;
            const ticketId = String(data.ticketCount).padStart(4, '0');

            const channelName = `ticket-${categoryName}-${ticketId}`;

            // 📂 CONFIG (si tenés setup)
            const configPath = path.join(__dirname, '../data/config.json');
            let categoryId = null;

            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath));
                categoryId = config.categoria_tickets || null;
            }

            // 🏗 Crear canal
            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: categoryId || null,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                        ],
                    },
                ],
            });

            // 💾 Guardar ticket
            data.tickets[channel.id] = {
                id: ticketId,
                userId: interaction.user.id,
                category: categoryName,
                status: 'open',
                createdAt: Date.now()
            };

            saveData(data);

            // 📩 Embed bienvenida
            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket Creado')
                .setDescription(`Categoría: **${categoryName}**\nUn staff te responderá pronto.`)
                .setColor('#5865F2')
                .setFooter({ text: `ID: ${ticketId}` });

            await channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
            });

            await interaction.reply({
                content: `✅ Ticket creado: ${channel}`,
                ephemeral: true,
            });

            return;
        }

        // ─────────────────────────────────────────
        // 📋 FORMULARIOS AVANZADOS
        // ─────────────────────────────────────────
        if (interaction.customId.startsWith('form_modal_')) {

            const fields = interaction.fields.fields;

            let content = '';
            fields.forEach(field => {
                content += `**${field.customId}**:\n${field.value}\n\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle('📩 Nueva Respuesta')
                .setDescription(content)
                .setColor('#ffaa00')
                .setTimestamp()
                .setFooter({
                    text: `Usuario: ${interaction.user.tag}`
                });

            // 📂 canal de logs (si existe)
            const configPath = path.join(__dirname, '../data/config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath));
                const logChannel = interaction.guild.channels.cache.get(config.canal_logs);

                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                }
            }

            await interaction.reply({
                content: '✅ Formulario enviado correctamente.',
                ephemeral: true
            });

            return;
        }

        // ─────────────────────────────────────────
        // ⚙️ PANEL CONFIG (TICKETS)
        // ─────────────────────────────────────────
        if (interaction.customId === 'panel_ticket_config') {

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color || '#5865F2');

            await interaction.reply({
                embeds: [embed]
            });

            return;
        }

        // ─────────────────────────────────────────
        // ⚙️ PANEL CONFIG (FORMS)
        // ─────────────────────────────────────────
        if (interaction.customId === 'panel_form_config') {

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');

            const embed = new EmbedBuilder()
                .setTitle(`📋 ${title}`)
                .setDescription(description)
                .setColor('#00ff99');

            await interaction.reply({
                embeds: [embed]
            });

            return;
        }

    } catch (error) {
        console.error('❌ Error en modalHandler:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Ocurrió un error procesando el modal.',
                ephemeral: true
            });
        }
    }
};
