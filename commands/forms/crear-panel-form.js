const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-form')
        .setDescription('Crea un panel de formularios profesional')
        .addStringOption(opt => opt.setName('titulo').setDescription('Título del panel').setRequired(true))
        .addStringOption(opt => opt.setName('descripcion').setDescription('Descripción del panel').setRequired(true))
        .addStringOption(opt => opt.setName('formularios').setDescription('Nombres de formularios separados por coma').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Color hex (ej: #5865F2)').setRequired(false))
        .addStringOption(opt => opt.setName('imagen').setDescription('URL de imagen de fondo (opcional)').setRequired(false)),

    async execute(interaction) {
        const titulo = interaction.options.getString('titulo');
        const descripcion = interaction.options.getString('descripcion');
        const formulariosRaw = interaction.options.getString('formularios');
        let color = interaction.options.getString('color') || '#5865F2';
        const imagen = interaction.options.getString('imagen') || null;

        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#5865F2';

        const formNames = formulariosRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (formNames.length === 0) {
            return interaction.reply({ content: '❌ Debes especificar al menos un formulario.', ephemeral: true });
        }

        // Verificar existencia
        const formsPath = './data/forms.json';
        let existingForms = {};
        if (fs.existsSync(formsPath)) {
            existingForms = JSON.parse(fs.readFileSync(formsPath));
        }
        const validForms = formNames.filter(name => existingForms[name]);
        if (validForms.length === 0) {
            return interaction.reply({ content: '❌ Ninguno de los formularios especificados existe. Usa `/listar-forms` para ver los disponibles.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(descripcion)
            .setColor(color)
            .setImage(imagen)
            .setFooter({ text: `Formularios disponibles: ${validForms.length}` })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('form_select')
            .setPlaceholder('📝 Selecciona un formulario')
            .addOptions(validForms.map(name => ({
                label: name,
                value: name,
                description: `Formulario: ${name}`,
                emoji: '📋'
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Panel creado con los formularios: ${validForms.join(', ')}`, ephemeral: true });
    }
};
