const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listar-forms')
        .setDescription('Listar todos los formularios con su canal de destino'),

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
            .setColor('#00aaff');
        for (const name of formNames) {
            const form = forms[name];
            const canal = interaction.guild.channels.cache.get(form.canalId);
            embed.addFields({ name: name, value: `📨 Respuestas: ${canal ? canal : 'Canal no encontrado'}\n❓ Preguntas: ${form.preguntas.length}`, inline: false });
        }
        await interaction.reply({ embeds: [embed] });
    }
};
