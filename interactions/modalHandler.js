const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

// Función para convertir texto a color de botón
function getButtonStyle(color) {
    const colors = {
        'primary': ButtonStyle.Primary,
        'secondary': ButtonStyle.Secondary,
        'success': ButtonStyle.Success,
        'danger': ButtonStyle.Danger,
        'blurple': ButtonStyle.Primary,
        'gris': ButtonStyle.Secondary,
        'verde': ButtonStyle.Success,
        'rojo': ButtonStyle.Danger,
        'azul': ButtonStyle.Primary
    };
    return colors[color.toLowerCase()] || ButtonStyle.Primary;
}

module.exports = async (interaction) => {
    try {
        // ============================================
        // 🎨 PANEL DE TICKETS PERSONALIZADO
        // ============================================
        if (interaction.customId === 'panel_ticket_modal') {
            await interaction.deferReply({ ephemeral: true });
            
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('descripcion');
            let color = interaction.fields.getTextInputValue('color') || '#5865F2';
            const botonesRaw = interaction.fields.getTextInputValue('botones');
            
            // Validar color hex
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                color = '#5865F2';
            }
            
            // Procesar botones: formato "nombre|emoji|color"
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
            
            if (botones.length === 0) {
                return interaction.editReply({ content: '❌ Debes especificar al menos un botón' });
            }
            
            // Crear embed
            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(desc)
                .setColor(color)
                .setFooter({ text: `📅 Creado: ${new Date().toLocaleString()}` })
                .setTimestamp();
            
            // Crear botones
            const row = new ActionRowBuilder();
            
            for (const btn of botones) {
                const button = new ButtonBuilder()
                    .setCustomId(`create_ticket_${btn.nombre.toLowerCase().replace(/\s/g, '_')}`)
                    .setLabel(btn.nombre)
                    .setStyle(getButtonStyle(btn.color));
                
                // Agregar emoji si no es el defecto
                if (btn.emoji && btn.emoji !== '🎫') {
                    button.setEmoji(btn.emoji);
                }
                
                row.addComponents(button);
            }
            
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ 
                content: `✅ Panel de tickets creado correctamente\n🎨 Color: ${color}\n🔘 Botones: ${botones.length}` 
            });
            return;
        }
        
        // ============================================
        // 🎫 CREAR TICKET
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
                .setFooter({ text: `ID: ${ticketId} | Usuario: ${interaction.user.tag}` })
                .setTimestamp();
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('Reclamar')
                    .setEmoji('👤')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Cerrar')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );
            
            await channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
                components: [row]
            });
            
            await interaction.editReply({ content: `✅ Ticket creado: ${channel}` });
            return;
        }
        
        // ============================================
        // 📝 CREAR FORMULARIO
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
            
            await interaction.reply({ 
                content: `✅ Formulario "${nombre}" creado correctamente.`,
                ephemeral: true 
            });
            return;
        }
        
    } catch (error) {
        console.error('❌ Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar el formulario', ephemeral: true });
        }
    }
};
