const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-form')
        .setDescription('Crea un panel visual con formularios')
        .addStringOption(opt => opt.setName('titulo').setDescription('Título del panel').setRequired(true))
        .addStringOption(opt => opt.setName('descripcion').setDescription('Descripción del panel').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Color hex (ej: #5865F2)').setRequired(false))
        .addStringOption(opt => opt.setName('formularios').setDescription('Nombres de formularios separados por coma').setRequired(true)),

    async execute(interaction) {
        const titulo = interaction.options.getString('titulo');
        const descripcion = interaction.options.getString('descripcion');
        let color = interaction.options.getString('color') || '#5865F2';
        const formulariosRaw = interaction.options.getString('formularios');

        // Validar color
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#5865F2';

        // Obtener nombres de formularios
        const formularios = formulariosRaw.split(',').map(f => f.trim()).filter(f => f.length > 0);
        if (formularios.length === 0) {
            return interaction.reply({ content: '❌ Debes especificar al menos un formulario.', ephemeral: true });
        }

        // Verificar que existan en data/forms.json
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) {
            return interaction.reply({ content: '❌ No hay formularios creados. Usa `/crear-form` primero.', ephemeral: true });
        }
        const forms = JSON.parse(fs.readFileSync(formsPath));
        const existingForms = Object.keys(forms);
        const validos = formularios.filter(f => existingForms.includes(f));
        const invalidos = formularios.filter(f => !existingForms.includes(f));

        if (validos.length === 0) {
            return interaction.reply({ content: '❌ Ninguno de los formularios especificados existe.', ephemeral: true });
        }

        // Crear embed
        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(descripcion)
            .setColor(color)
            .setTimestamp();

        // Crear menú desplegable con los formularios válidos
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('form_select')
            .setPlaceholder('Selecciona un formulario')
            .addOptions(
                validos.map(name => ({
                    label: name,
                    value: name,
                    description: `Formulario: ${name}`
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });

        let replyMsg = `✅ Panel creado con los formularios: ${validos.join(', ')}`;
        if (invalidos.length) {
            replyMsg += `\n⚠️ Los siguientes no existen y se ignoraron: ${invalidos.join(', ')}`;
        }
        await interaction.reply({ content: replyMsg, ephemeral: true });
    }
};
