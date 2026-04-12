const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-setup')
        .setDescription('⚠️ ELIMINA TODA la configuración y datos del bot (tickets, warns, verificación, etc.)')
        .addBooleanOption(opt => opt.setName('confirmar').setDescription('Escribe true para confirmar el reseteo completo').setRequired(true)),

    async execute(interaction) {
        const confirm = interaction.options.getBoolean('confirmar');
        if (!confirm) {
            return interaction.reply({ content: '❌ Operación cancelada. No se eliminó nada.', ephemeral: true });
        }

        // Verificar permisos: solo staff con rol o administrador
        let config = {};
        if (fs.existsSync('./data/config.json')) {
            config = JSON.parse(fs.readFileSync('./data/config.json'));
        }
        const isStaff = config.rol_staff && interaction.member.roles.cache.has(config.rol_staff);
        const isAdmin = interaction.member.permissions.has('Administrator');
        if (!isStaff && !isAdmin) {
            return interaction.reply({ content: '❌ No tienes permiso para usar este comando.', ephemeral: true });
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

        // Opcional: también podrías limpiar la carpeta de transcripciones si existe
        // fs.rmSync('./data/transcripts', { recursive: true, force: true });

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

        // Opcional: Reiniciar el bot (pero en Render lo hará automáticamente si se cae, mejor no forzar)
        // process.exit(0);
    }
};
