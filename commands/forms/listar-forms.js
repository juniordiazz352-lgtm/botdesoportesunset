const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listar-forms')
        .setDescription('Listar todos los formularios'),

    async execute(interaction) {
        const formsPath = './data/forms.json';
        if (!fs.existsSync(formsPath)) {
            return interaction.reply({ content: '❌ No hay formularios.', ephemeral: true });
        }
        const forms = JSON.parse(fs.readFileSync(formsPath));
        const formNames = Object.keys(forms);
        if (formNames.length === 0) {
            return interaction.reply({ content: '❌ No hay formularios.', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setTitle('📋 Formularios disponibles')
            .setDescription(formNames.map(n => `• ${n}`).join('\n'))
            .setColor('#00aaff');
        await interaction.reply({ embeds: [embed] });
    }
};
