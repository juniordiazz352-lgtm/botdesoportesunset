const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eliminar-form')
        .setDescription('Eliminar un formulario')
        .addStringOption(opt => opt.setName('nombre').setDescription('Nombre del formulario').setRequired(true)),

    async execute(interaction) {
        const nombre = interaction.options.getString('nombre');
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) {
            return interaction.reply({ content: '❌ No hay formularios.', ephemeral: true });
        }
        let forms = JSON.parse(fs.readFileSync(formsPath));
        if (!forms[nombre]) {
            return interaction.reply({ content: `❌ El formulario "${nombre}" no existe.`, ephemeral: true });
        }
        delete forms[nombre];
        fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2));
        await interaction.reply({ content: `✅ Formulario "${nombre}" eliminado.`, ephemeral: true });
    }
};
