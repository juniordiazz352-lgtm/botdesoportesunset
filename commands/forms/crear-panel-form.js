const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-form')
        .setDescription('Crea un panel visual con formularios')
        .addStringOption(opt => opt.setName('titulo').setDescription('Título del panel').setRequired(true))
        .addStringOption(opt => opt.setName('descripcion').setDescription('Descripción del panel').setRequired(true))
        .addStringOption(opt => opt.setName('formularios').setDescription('Nombres de formularios separados por comas').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Color hex (ej: #5865F2)').setRequired(false)),

    async execute(interaction) {
        const titulo = interaction.options.getString('titulo');
        const descripcion = interaction.options.getString('descripcion');
        const formulariosRaw = interaction.options.getString('formularios');
        const color = interaction.options.getString('color') || '#5865F2';

        // Validar color hex
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        const finalColor = hexRegex.test(color) ? color : '#5865F2';

        // Crear embed
        const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(descripcion)
            .setColor(finalColor)
            .setTimestamp();

        // Procesar formularios
        const formNames = formulariosRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (formNames.length === 0) {
            return interaction.reply({ content: '❌ Debes especificar al menos un formulario.', ephemeral: true });
        }

        // Verificar que existan
        const fs = require('fs');
        const formsPath = './data/forms.json';
        let existingForms = {};
        if (fs.existsSync(formsPath)) {
            existingForms = JSON.parse(fs.readFileSync(formsPath));
        }
        const validForms = formNames.filter(name => existingForms[name]);
        if (validForms.length === 0) {
            return interaction.reply({ content: '❌ Ninguno de los formularios especificados existe. Usa `/listar-forms` para ver los disponibles.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('form_select')
            .setPlaceholder('Selecciona un formulario')
            .addOptions(validForms.map(name => ({
                label: name,
                value: name,
                description: `Formulario: ${name}`
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Panel creado con los formularios: ${validForms.join(', ')}`, ephemeral: true });
    }
};
