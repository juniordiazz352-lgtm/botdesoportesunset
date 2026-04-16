const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

function getConfig() {
    if (fs.existsSync('./data/config.json')) return JSON.parse(fs.readFileSync('./data/config.json'));
    return {};
}

module.exports = async (interaction, client) => {
    try {

        // APROBAR FORMULARIO
        if (interaction.customId.startsWith('form_approve_')) {
            const parts = interaction.customId.replace('form_approve_', '').split('_');
            const submissionId = parts[0] + '_' + parts[1];

            let submissions = {};
            if (fs.existsSync('./data/submissions.json')) submissions = JSON.parse(fs.readFileSync('./data/submissions.json'));
            const sub = submissions[submissionId];
            if (!sub) return interaction.reply({ content: '❌ Respuesta no encontrada.', ephemeral: true });

            const canalAprobados = interaction.guild.channels.cache.get(sub.canalAprobados);
            if (canalAprobados) {
                const embed = new EmbedBuilder()
                    .setTitle('✅ Solicitud Aprobada: ' + sub.formName)
                    .setColor('#57F287')
                    .setDescription(sub.respuestas.map((r, i) => '**' + (i+1) + '. ' + r.pregunta + '**\n> ' + r.respuesta).join('\n\n'))
                    .addFields(
                        { name: '👤 Usuario', value: '<@' + sub.userId + '>', inline: true },
                        { name: '✅ Aprobado por', value: '<@' + interaction.user.id + '>', inline: true }
                    ).setTimestamp();
                await canalAprobados.send({ embeds: [embed] });
            }

            try {
                const user = await client.users.fetch(sub.userId);
                await user.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('✅ Tu solicitud fue aprobada')
                        .setColor('#57F287')
                        .setDescription('Tu formulario **' + sub.formName + '** fue **aprobado** por el staff. Felicitaciones!')
                        .setTimestamp()
                    ]
                });
            } catch (e) {}

            delete submissions[submissionId];
            fs.writeFileSync('./data/submissions.json', JSON.stringify(submissions, null, 2));
            return interaction.update({
                content: '✅ Aprobado por ' + interaction.user.tag,
                components: [],
                embeds: interaction.message.embeds
            });
        }

        // RECHAZAR FORMULARIO — abrir modal para razon
        if (interaction.customId.startsWith('form_reject_')) {
            const submissionId = interaction.customId.replace('form_reject_', '').split('_').slice(0,2).join('_');
            const modal = new ModalBuilder()
                .setCustomId('form_reject_reason_' + submissionId)
                .setTitle('Razon del Rechazo');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('razon')
                        .setLabel('Por que se rechaza la solicitud?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(500)
                )
            );
            return interaction.showModal(modal);
        }

    } catch (error) {
        console.error('Error en buttonHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar.', ephemeral: true });
        }
    }
};
