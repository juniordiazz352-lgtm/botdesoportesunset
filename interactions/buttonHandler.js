const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    if (customId.startsWith('approve_') || customId.startsWith('reject_')) {
        const [action, submissionId] = customId.split('_');
        const pendingPath = './data/pendingForms.json';
        if (!fs.existsSync(pendingPath)) {
            return interaction.reply({ content: '❌ No hay solicitudes pendientes.', ephemeral: true });
        }
        let pending = JSON.parse(fs.readFileSync(pendingPath));
        const submission = pending[submissionId];
        if (!submission) {
            return interaction.reply({ content: '❌ Esta solicitud ya fue procesada o no existe.', ephemeral: true });
        }

        // Verificar que quien aprueba/rechaza tiene rol staff
        let config = {};
        if (fs.existsSync('./data/config.json')) {
            config = JSON.parse(fs.readFileSync('./data/config.json'));
        }
        if (!interaction.member.roles.cache.has(config.rol_staff)) {
            return interaction.reply({ content: '❌ No tienes permiso para aprobar/rechazar formularios.', ephemeral: true });
        }

        // Eliminar de pendientes
        delete pending[submissionId];
        fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));

        // Construir embed con las respuestas
        let respuestasText = '';
        for (const [key, value] of Object.entries(submission.respuestas)) {
            respuestasText += `**${key}:**\n${value}\n\n`;
        }
        const resultEmbed = new EmbedBuilder()
            .setTitle(`📋 Formulario: ${submission.formName}`)
            .setDescription(respuestasText)
            .setAuthor({ name: submission.userTag, iconURL: interaction.user.displayAvatarURL() })
            .setFooter({ text: `Procesado por ${interaction.user.tag}` })
            .setTimestamp();

        // Enviar al canal correspondiente
        const targetChannelId = action === 'approve' ? config.forms?.canalAprobados : config.forms?.canalRechazados;
        if (targetChannelId) {
            const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
            if (targetChannel) {
                await targetChannel.send({ embeds: [resultEmbed] });
            }
        }

        // Notificar al usuario por DM
        try {
            const user = await interaction.client.users.fetch(submission.userId);
            const dmEmbed = new EmbedBuilder()
                .setTitle(action === 'approve' ? '✅ Formulario Aprobado' : '❌ Formulario Rechazado')
                .setDescription(`Tu formulario **${submission.formName}** ha sido ${action === 'approve' ? 'aprobado' : 'rechazado'} por ${interaction.user.tag}.`)
                .setColor(action === 'approve' ? 0x00ff00 : 0xff0000)
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        } catch (err) {
            console.error('No se pudo enviar DM al usuario');
        }

        await interaction.reply({ content: `✅ Formulario ${action === 'approve' ? 'aprobado' : 'rechazado'} y notificado al usuario.`, ephemeral: true });
    }
};
