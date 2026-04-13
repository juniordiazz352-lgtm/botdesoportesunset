const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

function getForms() {
    if (fs.existsSync('./data/forms.json')) return JSON.parse(fs.readFileSync('./data/forms.json'));
    return {};
}

module.exports = async (interaction, client) => {
    try {
        if (interaction.customId === 'form_select') {
            const formName = interaction.values[0];
            const forms = getForms();
            const formData = forms[formName];

            if (!formData || !formData.preguntas || formData.preguntas.length === 0) {
                return interaction.reply({ content: 'Formulario no encontrado o sin preguntas. Usa /crear-form de nuevo.', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('form_modal_' + formName)
                .setTitle(formName.slice(0, 45));

            for (let i = 0; i < Math.min(formData.preguntas.length, 5); i++) {
                const input = new TextInputBuilder()
                    .setCustomId('pregunta_' + i)
                    .setLabel(formData.preguntas[i].slice(0, 45))
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(1000);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
            }

            return interaction.showModal(modal);
        }
    } catch (error) {
        console.error('Error en selectMenuHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Error al procesar la seleccion.', ephemeral: true });
        }
    }
};
