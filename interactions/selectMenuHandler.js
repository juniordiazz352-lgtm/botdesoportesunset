const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'form_select') {
        // Obtener el nombre del formulario seleccionado
        const formName = interaction.values[0];
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) {
            // Si no hay formularios, responder con un mensaje efímero
            return interaction.reply({ content: '❌ No hay formularios disponibles.', ephemeral: true });
        }
        const forms = JSON.parse(fs.readFileSync(formsPath));
        const form = forms[formName];
        if (!form) {
            return interaction.reply({ content: `❌ El formulario "${formName}" no existe.`, ephemeral: true });
        }

        // Crear modal con las preguntas
        const modal = new ModalBuilder()
            .setCustomId(`form_modal_${formName}`)
            .setTitle(`📝 ${formName}`);

        const preguntas = form.preguntas;
        for (let i = 0; i < preguntas.length; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`pregunta_${i+1}`)
                .setLabel(preguntas[i].slice(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }

        // Mostrar el modal (esto responde a la interacción inmediatamente)
        await interaction.showModal(modal);
    }
};
