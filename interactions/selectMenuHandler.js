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
                return interaction.reply({ content: '❌ Formulario no encontrado o sin preguntas.', ephemeral: true });
            }

            // Solo hasta 5 preguntas en modal — si tiene mas, usar DM
            if (formData.preguntas.length <= 5) {
                const modal = new ModalBuilder()
                    .setCustomId('form_modal_' + formName)
                    .setTitle(formName.slice(0, 45));

                for (let i = 0; i < formData.preguntas.length; i++) {
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('pregunta_' + i)
                                .setLabel(formData.preguntas[i].slice(0, 45))
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true).setMaxLength(1000)
                        )
                    );
                }
                return interaction.showModal(modal);
            }

            // Mas de 5 preguntas — responder por DM
            let dm;
            try { dm = await interaction.user.createDM(); }
            catch (e) { return interaction.reply({ content: '❌ No pude enviarte un DM. Activa los mensajes directos del servidor.', ephemeral: true }); }

            // Guardar sesion de respuesta
            let responseSessions = {};
            if (fs.existsSync('./data/responseSessions.json')) responseSessions = JSON.parse(fs.readFileSync('./data/responseSessions.json'));
            responseSessions[interaction.user.id] = {
                formName,
                guildId: interaction.guild.id,
                respuestas: [],
                paso: 0,
                total: formData.preguntas.length
            };
            fs.writeFileSync('./data/responseSessions.json', JSON.stringify(responseSessions, null, 2));

            await interaction.reply({ content: '📬 Te envie un DM con las preguntas del formulario.', ephemeral: true });
            const { EmbedBuilder } = require('discord.js');
            await dm.send({
                embeds: [new EmbedBuilder()
                    .setTitle('📋 Formulario: ' + formName)
                    .setDescription('Voy a hacerte **' + formData.preguntas.length + '** preguntas una por una.\n\n⏰ Tienes **3 minutos** por pregunta.')
                    .setColor('#5865F2')
                    .setFooter({ text: 'Pregunta 1 de ' + formData.preguntas.length })
                ]
            });
            await dm.send('✏️ **Pregunta 1 de ' + formData.preguntas.length + ':**\n' + formData.preguntas[0]);
        }
    } catch (error) {
        console.error('Error en selectMenuHandler:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error al procesar.', ephemeral: true });
        }
    }
};
