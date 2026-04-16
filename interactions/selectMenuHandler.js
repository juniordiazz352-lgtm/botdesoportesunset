const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'form_select') return;

    const selectedForm = interaction.values[0];
    const formsPath = './data/forms.json';
    if (!fs.existsSync(formsPath)) return;
    const forms = JSON.parse(fs.readFileSync(formsPath));
    const formData = forms[selectedForm];
    if (!formData) return;

    const modal = new ModalBuilder()
        .setCustomId(`form_modal_${selectedForm}`)
        .setTitle(`📝 ${selectedForm}`);

    const preguntas = formData.preguntas.split('\n');
    for (let i = 0; i < Math.min(preguntas.length, 5); i++) { // Discord limita a 5 campos
        const input = new TextInputBuilder()
            .setCustomId(`pregunta_${i+1}`)
            .setLabel(preguntas[i].slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
    }

    await interaction.showModal(modal);
};
