const { createTranscript } = require('discord-html-transcripts');
const fs = require('fs');
const path = require('path');

const { setTicketClaimed } = require('../utils/ticketUtils');
const { closeTicket } = require('../utils/dataManager');

const configPath = path.join(__dirname, '../data/config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : {};

module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        console.log('🔘 Botón presionado:', interaction.customId);

        // ======================================================
        // 👤 RECLAMAR TICKET
        // ======================================================
        if (interaction.customId === 'claim_ticket') {

            await interaction.deferReply({ ephemeral: true });

            await setTicketClaimed(interaction.channel, interaction.user.username);

            await interaction.editReply(`👤 Ticket reclamado por ${interaction.user}`);

            // LOG
            const logsChannel = interaction.guild.channels.cache.get(config.canal_logs);
            if (logsChannel) {
                await logsChannel.send({
                    content: `👤 Ticket reclamado\n🛠 Staff: ${interaction.user}\n📁 Canal: ${interaction.channel}`
                });
            }
        }

        // ======================================================
        // 🔒 CERRAR TICKET
        // ======================================================
        if (interaction.customId === 'close_ticket') {

            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.channel;

            // 📑 Crear transcript HTML
            const transcript = await createTranscript(channel, {
                limit: -1,
                returnType: 'attachment',
                filename: `${channel.name}.html`,
            });

            const logsChannel = interaction.guild.channels.cache.get(config.canal_logs);

            // 🧠 Obtener info del ticket (owner + tiempo)
            let ownerId = 'desconocido';
            let duration = 'desconocido';

            if (channel.topic && channel.topic.includes('owner:')) {
                try {
                    const parts = channel.topic.split('|');

                    ownerId = parts[0].split(':')[1];
                    const start = parseInt(parts[1].split(':')[1]);

                    duration = Math.floor((Date.now() - start) / 1000) + 's';

                    // 🔓 liberar usuario (anti-spam)
                    closeTicket(ownerId);

                } catch (err) {
                    console.error('Error leyendo topic:', err);
                }
            }

            // 📊 LOG COMPLETO
            if (logsChannel) {
                await logsChannel.send({
                    content:
`📊 Ticket cerrado
👤 Usuario: <@${ownerId}>
🛠 Staff: ${interaction.user}
⏱ Duración: ${duration}
📁 Canal: ${channel.name}`,
                    files: [transcript]
                });
            }

            await interaction.editReply('✅ Ticket cerrado. Eliminando canal en 3 segundos...');

            // 🧹 eliminar canal
            setTimeout(() => {
                channel.delete().catch(err => console.error(err));
            }, 3000);
        }

    } catch (error) {
        console.error('❌ Error en buttonHandler:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Error al usar el botón.',
                ephemeral: true
            });
        }
    }
};
