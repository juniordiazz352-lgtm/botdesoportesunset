const {
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// OPCIONAL (transcripts)
let transcripts;
try {
    transcripts = require('discord-html-transcripts');
} catch {
    transcripts = null;
}

const dataPath = path.join(__dirname, '../data/data.json');
const configPath = path.join(__dirname, '../data/config.json');

// ─────────────────────────────────────────────
// 📦 UTILIDADES
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 🚀 HANDLER
// ─────────────────────────────────────────────
module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        const data = loadData();
        const config = loadConfig();
        const ticket = data.tickets[interaction.channel.id];

        // ❌ No es ticket
        if (!ticket) return;

        // ─────────────────────────────────────────
        // 🔒 CERRAR TICKET
        // ─────────────────────────────────────────
        if (interaction.customId === 'ticket_close') {

            if (!interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({
                    content: '❌ Solo el staff puede cerrar tickets.',
                    ephemeral: true
                });
            }

            ticket.status = 'closed';
            ticket.closedAt = Date.now();

            // 🔐 bloquear canal
            await interaction.channel.permissionOverwrites.edit(ticket.userId, {
                SendMessages: false
            });

            await interaction.channel.setName(`cerrado-${ticket.id}`);

            // 📄 TRANSCRIPCIÓN
            if (transcripts) {
                const attachment = await transcripts.createTranscript(interaction.channel, {
                    limit: -1,
                    filename: `ticket-${ticket.id}.html`
                });

                const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
                if (logChannel) {
                    await logChannel.send({
                        content: `📁 Transcript del ticket ${ticket.id}`,
                        files: [attachment]
                    });
                }
            }

            saveData(data);

            // ⭐ FEEDBACK (DM)
            try {
                const user = await interaction.client.users.fetch(ticket.userId);

                await user.send({
                    content: '⭐ ¿Cómo calificarías el soporte?',
                    components: [
                        {
                            type: 1,
                            components: [1,2,3,4,5].map(n => ({
                                type: 2,
                                label: `${n}⭐`,
                                style: 1,
                                custom_id: `feedback_${n}_${ticket.id}`
                            }))
                        }
                    ]
                });
            } catch {}

            await interaction.reply({
                content: '🔒 Ticket cerrado correctamente.',
                ephemeral: false
            });

            return;
        }

        // ─────────────────────────────────────────
        // 👤 RECLAMAR TICKET
        // ─────────────────────────────────────────
        if (interaction.customId === 'ticket_claim') {

            if (!interaction.member.roles.cache.has(config.rol_staff)) {
                return interaction.reply({
                    content: '❌ Solo el staff puede reclamar.',
                    ephemeral: true
                });
            }

            ticket.claimedBy = interaction.user.id;
            ticket.status = 'claimed';

            await interaction.channel.setName(`reclamado-${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setDescription(`👤 Ticket reclamado por ${interaction.user}`)
                .setColor('#00ff99');

            await interaction.reply({ embeds: [embed] });

            saveData(data);
            return;
        }

        // ─────────────────────────────────────────
        // ⏳ PONER EN ESPERA
        // ─────────────────────────────────────────
        if (interaction.customId === 'ticket_wait') {

            ticket.status = 'waiting';

            await interaction.channel.setName(`espera-${ticket.id}`);

            await interaction.reply({
                content: '⏳ Ticket en espera.',
                ephemeral: false
            });

            saveData(data);
            return;
        }

        // ─────────────────────────────────────────
        // 📑 TRANSCRIPCIÓN MANUAL
        // ─────────────────────────────────────────
        if (interaction.customId === 'ticket_transcript') {

            if (!transcripts) {
                return interaction.reply({
                    content: '❌ Instala discord-html-transcripts.',
                    ephemeral: true
                });
            }

            const attachment = await transcripts.createTranscript(interaction.channel);

            await interaction.reply({
                content: '📄 Transcript generado.',
                files: [attachment],
                ephemeral: true
            });

            return;
        }

        // ─────────────────────────────────────────
        // ⭐ FEEDBACK
        // ─────────────────────────────────────────
        if (interaction.customId.startsWith('feedback_')) {

            const [_, stars, ticketId] = interaction.customId.split('_');

            const logChannel = interaction.guild.channels.cache.get(config.canal_logs);

            if (logChannel) {
                await logChannel.send({
                    content: `⭐ Feedback recibido: ${stars}/5 (Ticket ${ticketId})`
                });
            }

            await interaction.reply({
                content: `Gracias por tu feedback de ${stars}⭐`,
                ephemeral: true
            });

            return;
        }

    } catch (error) {
        console.error('❌ Error en buttonHandler:', error);

        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Error procesando el botón.',
                ephemeral: true
            });
        }
    }
};


