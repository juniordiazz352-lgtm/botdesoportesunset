const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    try {
        // PANEL DE TICKETS
        if (interaction.customId === 'panel_ticket_modal') {
            await interaction.deferReply({ ephemeral: true });
            
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('descripcion');
            const botones = interaction.fields.getTextInputValue('botones').split(',').map(b => b.trim());
            
            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(desc)
                .setColor('#5865F2');
            
            const row = new ActionRowBuilder();
            
            botones.forEach(b => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`create_ticket_${b}`)
                        .setLabel(b.charAt(0).toUpperCase() + b.slice(1))
                        .setStyle(ButtonStyle.Primary)
                );
            });
            
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Panel de tickets creado correctamente' });
        }
        
        // CREAR TICKET
        if (interaction.customId.startsWith('ticket_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            
            const configPath = './data/config.json';
            let config = {};
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath));
            }
            
            const category = interaction.customId.replace('ticket_modal_', '');
            const motivo = interaction.fields.getTextInputValue('motivo');
            const ticketId = Date.now().toString().slice(-6);
            
            const channel = await interaction.guild.channels.create({
                name: `ticket-${category}-${ticketId}`,
                type: ChannelType.GuildText,
                parent: config.categoria_tickets || null,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                ]
            });
            
            // Agregar staff si existe en config
            if (config.rol_staff) {
                await channel.permissionOverwrites.edit(config.rol_staff, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`🎫 Ticket - ${category.toUpperCase()}`)
                .setDescription(`**Motivo:**\n${motivo}`)
                .setColor('#5865F2')
                .setFooter({ text: `ID: ${ticketId}` })
                .setTimestamp();
            
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
            
            await interaction.editReply({ content: `✅ Ticket creado: ${channel}` });
        }
        
        // CREAR FORMULARIO
        if (interaction.customId === 'crear_form_modal') {
            const nombre = interaction.fields.getTextInputValue('nombre');
            
            // Guardar formulario
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
            
            await interaction.reply({ 
                content: `✅ Formulario "${nombre}" creado correctamente.\nUsa /crear-panel-form para mostrarlo.`,
                ephemeral: true 
            });
        }
    } catch (error) {
        console.error('❌ Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar el formulario', ephemeral: true });
        }
    }
};
