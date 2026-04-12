const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/data.json');

function loadData() {
    if (!fs.existsSync(dataPath)) return { tickets: {}, ticketCount: 0 };
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        const data = loadData();
        const ticket = data.tickets[interaction.channel.id];

        // 🎫 ABRIR MODAL
        if (interaction.customId.startsWith('create_ticket_')) {

            const category = interaction.customId.split('_')[2] || 'general';

            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${category}`)
                .setTitle('Crear Ticket');

            const input = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Describe tu problema')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);
            modal.addComponents(row);

            return interaction.showModal(modal);
        }

        if (!ticket) return;

        // 🔒 CERRAR
        if (interaction.customId === 'ticket_close') {

            ticket.status = 'closed';

            await interaction.channel.permissionOverwrites.edit(ticket.userId, {
                SendMessages: false
            });

            await interaction.channel.setName(`cerrado-${ticket.id}`);

            saveData(data);

            return interaction.reply({ content: '🔒 Ticket cerrado' });
        }

        // 👤 RECLAMAR
        if (interaction.customId === 'ticket_claim') {

            ticket.status = 'claimed';
            ticket.claimedBy = interaction.user.id;

            await interaction.channel.setName(`reclamado-${interaction.user.username}`);

            saveData(data);

            return interaction.reply({ content: `👤 Reclamado por ${interaction.user}` });
        }

    } catch (err) {
        console.error(err);
    }
};
