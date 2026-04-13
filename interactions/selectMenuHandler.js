const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'form_select') {
        const selectedForm = interaction.values[0];
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) return;
        const forms = JSON.parse(fs.readFileSync(formsPath));
        const formData = forms[selectedForm];
        if (!formData) return;

        // Crear un modal con las preguntas del formulario
        const modal = new ModalBuilder()
            .setCustomId(`form_modal_${selectedForm}`)
            .setTitle(`Formulario: ${selectedForm}`);

        const preguntas = formData.preguntas.split('\n');
        for (let i = 0; i < preguntas.length; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`pregunta_${i}`)
                .setLabel(preguntas[i].slice(0, 45)) // Discord limita a 45 caracteres
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }
        await interaction.showModal(modal);
    }
};
