const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Borrar mensajes en masa')
        .addIntegerOption(opt => opt.setName('cantidad').setDescription('Número de mensajes (1-100)').setRequired(true)),

    async execute(interaction) {
        // Verificar rol staff desde config.json (si no existe, solo admins pueden usar)
        let isStaff = false;
        if (fs.existsSync('./data/config.json')) {
            const config = JSON.parse(fs.readFileSync('./data/config.json'));
            isStaff = interaction.member.roles.cache.has(config.rol_staff);
        }
        if (!isStaff && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
        }

        let amount = interaction.options.getInteger('cantidad');
        if (amount < 1) amount = 1;
        if (amount > 100) amount = 100;
        const fetched = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(fetched, true);
        await interaction.reply({ content: `🗑️ Se borraron ${fetched.size} mensajes.`, ephemeral: true });
        setTimeout(() => interaction.deleteReply(), 3000);
    }
};
