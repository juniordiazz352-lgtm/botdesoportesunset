const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Configurar bienvenida')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de bienvenidas').setRequired(true))
        .addStringOption(opt => opt.setName('mensaje').setDescription('Mensaje (usa {user})').setRequired(true))
        .addStringOption(opt => opt.setName('roles').setDescription('IDs o menciones de roles (separados por espacio)').setRequired(false))
        .addStringOption(opt => opt.setName('imagen').setDescription('URL de imagen de fondo').setRequired(false)),

    async execute(interaction) {
        const canal = interaction.options.getChannel('canal');
        const mensaje = interaction.options.getString('mensaje');
        const rolesRaw = interaction.options.getString('roles');
        const imagen = interaction.options.getString('imagen');

        let roleIds = [];
        if (rolesRaw) {
            const matches = rolesRaw.match(/<@&(\d+)>|\d+/g);
            if (matches) roleIds = matches.map(m => m.replace(/\D/g, ''));
        }

        let config = {};
        if (fs.existsSync('./data/config.json')) config = JSON.parse(fs.readFileSync('./data/config.json'));
        config.welcome = { canal: canal.id, mensaje, roles: roleIds, imagen: imagen || null };
        fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('✅ Bienvenida configurada')
            .setDescription(`Canal: ${canal}\nRoles: ${roleIds.map(id => `<@&${id}>`).join(', ') || 'Ninguno'}\nImagen: ${imagen || 'Por defecto'}`)
            .setColor('#00ff00');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
