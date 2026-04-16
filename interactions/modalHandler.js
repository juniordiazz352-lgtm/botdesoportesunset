const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    // Formularios personalizados (se envían las respuestas a un canal de logs)
    if (interaction.customId.startsWith('form_modal_')) {
        const formName = interaction.customId.replace('form_modal_', '');
        const fields = interaction.fields.fields;
        
        let description = '';
        fields.forEach((field, index) => {
            description += `**Pregunta ${index + 1}:**\n${field.value}\n\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`📋 Respuesta del formulario: ${formName}`)
            .setDescription(description)
            .setColor('#00aaff')
            .setFooter({ text: `Enviado por ${interaction.user.tag} (${interaction.user.id})` })
            .setTimestamp();

        // Enviar a un canal de logs (puedes configurar uno)
        const configPath = './data/config.json';
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath));
            const logChannel = interaction.guild.channels.cache.get(config.canal_logs);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
        }

        await interaction.reply({ content: '✅ Formulario enviado correctamente. ¡Gracias!', ephemeral: true });
    }
};
