const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-verify')
        .setDescription('Configurar roles de verificación')
        .addRoleOption(opt => opt.setName('no_verificado').setDescription('Rol para usuarios no verificados').setRequired(true))
        .addRoleOption(opt => opt.setName('verificado').setDescription('Rol para usuarios verificados').setRequired(true)),

    async execute(interaction) {
        try {
            const noVerificado = interaction.options.getRole('no_verificado');
            const verificado = interaction.options.getRole('verificado');

            let config = {};
            if (fs.existsSync('./data/config.json')) {
                config = JSON.parse(fs.readFileSync('./data/config.json'));
            }
            config.verify = {
                noVerificado: noVerificado.id,
                verificado: verificado.id
            };
            fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('✅ Roles de verificación configurados')
                .setDescription(`**No verificado:** ${noVerificado}\n**Verificado:** ${verificado}`)
                .setColor('#00ff00');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Error al guardar configuración.', ephemeral: true });
        }
    }
};
