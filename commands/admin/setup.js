const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configurar el bot completamente')
        .addChannelOption(opt => opt.setName('logs').setDescription('Canal de logs').setRequired(true))
        .addRoleOption(opt => opt.setName('staff').setDescription('Rol staff').setRequired(true))
        .addStringOption(opt => opt.setName('categoria').setDescription('ID de la categoría para tickets').setRequired(true))
        .addChannelOption(opt => opt.setName('feedback').setDescription('Canal para valoraciones').setRequired(true))
        .addRoleOption(opt => opt.setName('verified').setDescription('Rol para usuarios verificados').setRequired(false)),

    async execute(interaction) {
        try {
            const logs = interaction.options.getChannel('logs');
            const staff = interaction.options.getRole('staff');
            const categoriaId = interaction.options.getString('categoria');
            const feedback = interaction.options.getChannel('feedback');
            const verified = interaction.options.getRole('verified');

            const categoria = interaction.guild.channels.cache.get(categoriaId);
            if (!categoria || categoria.type !== 4) {
                return interaction.reply({ content: '❌ ID de categoría inválido. Usa el ID numérico (no la mención).', ephemeral: true });
            }

            const config = {
                canal_logs: logs.id,
                rol_staff: staff.id,
                categoria_tickets: categoria.id,
                canal_feedback: feedback.id,
                rol_verified: verified ? verified.id : null
            };
            fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('✅ Configuración Guardada')
                .setColor('#00ff00')
                .addFields(
                    { name: '📋 Logs', value: `${logs}`, inline: true },
                    { name: '👥 Staff', value: `${staff}`, inline: true },
                    { name: '📁 Categoría', value: `${categoria.name} (ID: ${categoria.id})`, inline: true },
                    { name: '⭐ Feedback', value: `${feedback}`, inline: true },
                    { name: '✅ Verificado', value: verified ? `${verified}` : 'No configurado', inline: true }
                );
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Error al guardar configuración.', ephemeral: true });
        }
    }
};
