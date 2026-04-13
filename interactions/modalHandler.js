const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

let ticketCounters = {};

function loadCounters() {
    if (fs.existsSync('./data/counters.json')) {
        ticketCounters = JSON.parse(fs.readFileSync('./data/counters.json'));
    }
}

function saveCounters() {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/counters.json', JSON.stringify(ticketCounters, null, 2));
}

function getNextTicketNumber(category) {
    if (!ticketCounters[category]) ticketCounters[category] = 0;
    ticketCounters[category]++;
    saveCounters();
    return String(ticketCounters[category]).padStart(4, '0');
}

function getButtonStyle(color) {
    const map = { primary: ButtonStyle.Primary, secondary: ButtonStyle.Secondary, success: ButtonStyle.Success, danger: ButtonStyle.Danger };
    return map[color?.toLowerCase()] || ButtonStyle.Primary;
}

function getForms() {
    if (fs.existsSync('./data/forms.json')) return JSON.parse(fs.readFileSync('./data/forms.json'));
    return {};
}

function saveForms(forms) {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/forms.json', JSON.stringify(forms, null, 2));
}

function getTickets() {
    if (fs.existsSync('./data/tickets.json')) return JSON.parse(fs.readFileSync('./data/tickets.json'));
    return {};
}

function saveTickets(tickets) {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/tickets.json', JSON.stringify(tickets, null, 2));
}

module.exports = async (interaction, client) => {
    try {
        loadCounters();

        // PANEL DE TICKETS
        if (interaction.customId === 'panel_ticket_modal') {
            await interaction.deferReply({ ephemeral: true });
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('descripcion');
            let color = interaction.fields.getTextInputValue('color') || '#5865F2';
            const botonesRaw = interaction.fields.getTextInputValue('botones');
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#5865F2';

            const botones = [];
            for (const linea of botonesRaw.split('\n')) {
                const partes = linea.split('|');
                if (partes[0]?.trim()) {
                    botones.push({
                        nombre: partes[0].trim(),
                        emoji: partes[1]?.trim() || '🎫',
                        color: partes[2]?.trim().toLowerCase() || 'primary'
                    });
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(desc)
                .setColor(color)
                .setFooter({ text: 'Haz clic en un boton para abrir un ticket' })
                .setTimestamp();

            const row = new ActionRowBuilder();
            for (const btn of botones.slice(0, 5)) {
                const button = new ButtonBuilder()
                    .setCustomId('create_ticket_' + btn.nombre.toLowerCase().replace(/\s/g, '_'))
                    .setLabel(btn.nombre)
                    .setEmoji(btn.emoji)
                    .setStyle(getButtonStyle(btn.color));
                row.addComponents(button);
            }

            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.editReply({ content: '✅ Panel de tickets creado con ' + botones.length + ' botones.' });
        }

        // CREAR TICKET DESDE MODAL
        if (interaction.customId.startsWith('ticket_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            let config = {};
            if (fs.existsSync('./data/config.json')) config = JSON.parse(fs.readFileSync('./data/config.json'));

            const category = interaction.customId.replace('ticket_modal_', '');
            const motivo = interaction.fields.getTextInputValue('motivo');
            const ticketNumber = getNextTicketNumber(category);
            const ticketId = category + '-' + ticketNumber;

            const channel = await interaction.guild.channels.create({
                name: 'ticket-' + ticketId,
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

            const tickets = getTickets();
            tickets[channel.id] = {
                ticketId, category,
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                channelId: channel.id,
                createdAt: Date.now(),
                claimedBy: null,
                status: 'open'
            };
            saveTickets(tickets);

            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket ' + ticketId)
                .setDescription('**Categoria:** ' + category + '\n**Motivo:**\n' + motivo)
                .setColor('#5865F2')
                .setFooter({ text: 'ID: ' + ticketId + ' | ' + interaction.user.tag })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setEmoji('👤').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setEmoji('📄').setStyle(ButtonStyle.Secondary)
            );

            await channel.send({ content: '<@' + interaction.user.id + '>', embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Ticket creado: ' + channel });

            const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🎫 Nuevo Ticket')
                    .setColor('#00ff00')
                    .addFields(
                        { name: 'ID', value: ticketId, inline: true },
                        { name: 'Categoria', value: category, inline: true },
                        { name: 'Usuario', value: '<@' + interaction.user.id + '>', inline: true }
                    ).setTimestamp();
                await logChannel.send({ embeds: [logEmbed] });
            }
            return;
        }

        // CREAR FORMULARIO (guarda nombre + preguntas + canal)
        if (interaction.customId === 'crear_form_modal') {
            const nombre = interaction.fields.getTextInputValue('nombre').trim();
            const preguntasRaw = interaction.fields.getTextInputValue('preguntas');
            const canalId = interaction.fields.getTextInputValue('canal_id').trim();

            const preguntas = preguntasRaw.split('\n').map(p => p.trim()).filter(p => p.length > 0).slice(0, 5);

            if (preguntas.length === 0) {
                return interaction.reply({ content: 'Debes ingresar al menos una pregunta.', ephemeral: true });
            }

            const canalRespuestas = interaction.guild.channels.cache.get(canalId);
            if (!canalRespuestas) {
                return interaction.reply({ content: 'No encontre el canal con ese ID. Verifica que sea correcto.', ephemeral: true });
            }

            const forms = getForms();
            forms[nombre] = {
                nombre,
                preguntas,
                canalRespuestas: canalId,
                creadoPor: interaction.user.id,
                creadoEn: Date.now()
            };
            saveForms(forms);

            const embed = new EmbedBuilder()
                .setTitle('✅ Formulario Creado')
                .setColor('#57F287')
                .addFields(
                    { name: 'Nombre', value: nombre, inline: true },
                    { name: 'Preguntas', value: preguntas.length.toString(), inline: true },
                    { name: 'Canal de respuestas', value: '<#' + canalId + '>', inline: true },
                    { name: 'Lista de preguntas', value: preguntas.map((p, i) => (i + 1) + '. ' + p).join('\n') }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // PANEL DE FORMULARIOS (con titulo, descripcion y color)
        if (interaction.customId === 'panel_form_selector') {
            const titulo = interaction.fields.getTextInputValue('titulo');
            const descripcion = interaction.fields.getTextInputValue('descripcion');
            let color = interaction.fields.getTextInputValue('color') || '#EB459E';
            const raw = interaction.fields.getTextInputValue('form_list');

            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#EB459E';

            const selectedNames = [...new Set(raw.split(',').map(s => s.trim()).filter(s => s.length > 0))];
            const forms = getForms();
            const validNames = selectedNames.filter(name => forms[name]);
            const invalidNames = selectedNames.filter(name => !forms[name]);

            if (validNames.length === 0) {
                return interaction.reply({ content: 'Ningun formulario encontrado. Usa /listar-forms para ver los nombres exactos.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(descripcion)
                .setColor(color)
                .addFields({
                    name: '📋 Formularios disponibles',
                    value: validNames.map(n => '• **' + n + '** — ' + forms[n].preguntas.length + ' preguntas').join('\n')
                })
                .setFooter({ text: 'Selecciona un formulario del menu desplegable' })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('form_select')
                .setPlaceholder('📋 Selecciona un formulario...')
                .addOptions(validNames.map(name => ({
                    label: name,
                    value: name,
                    description: forms[name].preguntas.length + ' preguntas',
                    emoji: '📋'
                })));

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.channel.send({ embeds: [embed], components: [row] });

            let reply = '✅ Panel creado con: ' + validNames.join(', ');
            if (invalidNames.length > 0) reply += '\n⚠️ No encontrados (verifica el nombre exacto): ' + invalidNames.join(', ');
            return interaction.reply({ content: reply, ephemeral: true });
        }

        // RESPUESTAS DEL FORMULARIO (desde modal generado por selectMenu)
        if (interaction.customId.startsWith('form_modal_')) {
            const formName = interaction.customId.replace('form_modal_', '');
            const forms = getForms();
            const formData = forms[formName];
            if (!formData) return interaction.reply({ content: 'Formulario no encontrado.', ephemeral: true });

            const respuestas = formData.preguntas.map((pregunta, i) => ({
                pregunta,
                respuesta: interaction.fields.getTextInputValue('pregunta_' + i)
            }));

            const embed = new EmbedBuilder()
                .setTitle('📋 Nueva Respuesta: ' + formName)
                .setColor('#5865F2')
                .setDescription(respuestas.map((r, i) => '**' + (i + 1) + '. ' + r.pregunta + '**\n' + r.respuesta).join('\n\n'))
                .addFields({ name: 'Usuario', value: '<@' + interaction.user.id + '> (' + interaction.user.tag + ')', inline: true })
                .setTimestamp();

            const canalRespuestas = interaction.guild.channels.cache.get(formData.canalRespuestas);
            if (canalRespuestas) {
                await canalRespuestas.send({ embeds: [embed] });
                return interaction.reply({ content: '✅ Tu formulario fue enviado correctamente.', ephemeral: true });
            } else {
                return interaction.reply({ content: 'No se encontro el canal de respuestas. Avisa a un administrador.', ephemeral: true });
            }
        }

    } catch (error) {
        console.error('Error en modalHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Error al procesar el formulario.', ephemeral: true });
        }
    }
};
