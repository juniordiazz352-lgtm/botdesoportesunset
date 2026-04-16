const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listar-forms')
        .setDescription('Muestra todos los formularios creados')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!fs.existsSync('./data/forms.json')) {
            return interaction.reply({ content: '❌ No hay formularios creados.', ephemeral: true });
        }
        const forms = JSON.parse(fs.readFileSync('./data/forms.json'));
        const names = Object.keys(forms);
        if (names.length === 0) return interaction.reply({ content: '❌ No hay formularios.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('📋 Formularios Creados')
            .setColor('#5865F2')
            .setDescription(names.map((n, i) => {
                const f = forms[n];
                return '**' + (i+1) + '. ' + n + '**\n' +
                    '❓ ' + f.preguntas.length + ' preguntas\n' +
                    '📥 Respuestas: <#' + f.canalRespuestas + '>\n' +
                    '✅ Aprobados: <#' + f.canalAprobados + '>\n' +
                    '❌ Rechazados: <#' + f.canalRechazados + '>';
            }).join('\n\n'))
            .setFooter({ text: 'Total: ' + names.length + ' formulario(s)' })
            .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
