const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-panel-form')
        .setDescription('Crea un panel visual con formularios')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!fs.existsSync('./data/forms.json')) return interaction.reply({ content: '❌ No hay formularios. Usa /crear-form primero.', ephemeral: true });
        const forms = JSON.parse(fs.readFileSync('./data/forms.json'));
        const names = Object.keys(forms);
        if (names.length === 0) return interaction.reply({ content: '❌ No hay formularios creados.', ephemeral: true });

        const modal = new ModalBuilder()
            .setCustomId('panel_form_selector')
            .setTitle('Configurar Panel de Formularios');
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('titulo')
                    .setLabel('Titulo del panel')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: Centro de Solicitudes')
                    .setRequired(true).setMaxLength(100)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('descripcion')
                    .setLabel('Descripcion del panel')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Selecciona el formulario que deseas completar...')
                    .setRequired(true).setMaxLength(1000)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color')
                    .setLabel('Color hex (ej: #EB459E)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('#5865F2')
                    .setRequired(false).setMaxLength(7)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('form_list')
                    .setLabel('Formularios a mostrar (separados por coma)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder(names.join(', '))
                    .setRequired(true).setMaxLength(500)
            )
        );
        await interaction.showModal(modal);
    }
};
