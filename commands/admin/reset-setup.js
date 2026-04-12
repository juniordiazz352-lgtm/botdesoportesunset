const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-setup')
        .setDescription('⚠️ ELIMINA TODA la configuración y datos del bot (solo el dueño)')
        .addBooleanOption(opt => opt.setName('confirmar').setDescription('Escribe true para confirmar el reseteo completo').setRequired(true)),

    async execute(interaction) {
        // Verificar que el usuario sea el dueño (OWNER_ID definido en .env)
        const ownerId = process.env.OWNER_ID;
        if (!ownerId) {
            // Si no está definido, solo administradores (por seguridad)
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ No tienes permiso. Contacta al dueño del bot.', ephemeral: true });
            }
        } else if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Solo el dueño del bot puede usar este comando.', ephemeral: true });
        }

        const confirm = interaction.options.getBoolean('confirmar');
        if (!confirm) {
            return interaction.reply({ content: '❌ Operación cancelada. No se eliminó nada.', ephemeral: true });
        }

        // Lista de archivos a eliminar (todos los datos del bot)
        const dataFiles = [
            'config.json',
            'tickets.json',
            'warns.json',
            'robloxUsers.json',
            'verifyCodes.json',
            'counters.json',
            'forms.json',
            'goodbye.json',
            'welcome.json'
        ];
        const dataDir = './data';
        let deleted = [];
        let notFound = [];

        for (const file of dataFiles) {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted.push(file);
            } else {
                notFound.push(file);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔄 Reseteo completo del bot')
            .setDescription(`Se han eliminado ${deleted.length} archivos de datos.`)
            .addFields(
                { name: '✅ Eliminados', value: deleted.length ? `\`${deleted.join('`, `')}\`` : 'Ninguno', inline: false },
                { name: 'ℹ️ No encontrados', value: notFound.length ? `\`${notFound.join('`, `')}\`` : 'Todos existían', inline: false }
            )
            .setColor('#ff0000')
            .setFooter({ text: 'El bot está en su estado original. Usa /setup nuevamente para configurarlo.' });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
