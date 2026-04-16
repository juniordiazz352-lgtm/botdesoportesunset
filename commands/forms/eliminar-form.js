const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eliminar-form')
        .setDescription('Elimina un formulario existente')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('nombre')
                .setDescription('Nombre exacto del formulario')
                .setRequired(true)
        ),
    async execute(interaction) {
        const nombre = interaction.options.getString('nombre');
        if (!fs.existsSync('./data/forms.json')) return interaction.reply({ content: '❌ No hay formularios.', ephemeral: true });
        const forms = JSON.parse(fs.readFileSync('./data/forms.json'));
        if (!forms[nombre]) return interaction.reply({ content: '❌ No existe un formulario llamado **' + nombre + '**.', ephemeral: true });
        delete forms[nombre];
        fs.writeFileSync('./data/forms.json', JSON.stringify(forms, null, 2));
        return interaction.reply({
            embeds: [new EmbedBuilder().setColor('#ED4245').setDescription('🗑️ Formulario **' + nombre + '** eliminado.')],
            ephemeral: true
        });
    }
};
