const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

let ticketCount = 0;

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    try {

        // ─────────────────────────────────────────────
        // 🎫 PANEL TICKET CONFIG
        // ─────────────────────────────────────────────
        if (interaction.customId === 'panel_ticket_config') {

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color || '#5865F2');

            await interaction.reply({
                embeds: [embed],
                ephemeral: false
            });

            return;
        }

        // ─────────────────────────────────────────────
        // 🧾 PANEL FORM CONFIG
        // ─────────────────────────────────────────────
        if (interaction.customId === 'panel_form_config') {

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');

            const embed = new EmbedBuilder()
                .setTitle(`📋 ${title}`)
                .setDescription(description)
                .setColor('#00ff99');

            await interaction.reply({
                embeds: [embed],
                ephemeral: false
            });

            return;
        }

        // ─────────────────────────────────────────────
        // 🎫 CREAR TICKET DESDE MODAL
        // ─────────────────────────────────────────────
        if (interaction.customId.startsWith('ticket_modal_')) {

            const category = interaction.customId.split('_')[2] || 'general';
            const guild = interaction.guild;

            ticketCount++;
            const ticketName = `ticket-${category}-${String(ticketCount).padStart(4, '0')}`;

            const channel = await guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: null, // podés poner categoría luego
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
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

            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket Abierto')
                .setDescription(`Hola ${interaction.user}, el staff te responderá pronto.`)
                .setColor('#5865F2');

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

        // ─────────────────────────────────────────────
        // 🧾 FORMULARIOS (RESPUESTA)
        // ─────────────────────────────────────────────
        if (interaction.customId.startsWith('form_modal_')) {

            const responses = interaction.fields.fields.map(field => {
                return `**${field.customId}**: ${field.value}`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setTitle('📩 Nueva Respuesta de Formulario')
                .setDescription(responses)
                .setColor('#ffaa00')
                .setFooter({
                    text: `Usuario: ${interaction.user.tag}`
                });

            await interaction.reply({
                content: '✅ Formulario enviado correctamente',
                ephemeral: true
            });

            // Podés enviar esto a un canal de logs después
            console.log(responses);

            return;
        }

    } catch (error) {
        console.error('❌ Error en modalHandler:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Error procesando el modal.',
                ephemeral: true
            });
        }
    }
};
