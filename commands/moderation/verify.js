const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateCode } = require('../../utils/robloxVerify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verifica tu cuenta de Roblox (código único, expira en 10 min)'),

    async execute(interaction) {
        await interaction.reply({ content: '✅ Revisa tus mensajes directos.', ephemeral: true });

        const user = interaction.user;
        const dm = await user.createDM().catch(() => null);
        if (!dm) return;

        const code = getOrCreateCode(user.id);

        const embed = new EmbedBuilder()
            .setTitle('🔐 Verificación Roblox')
            .setDescription(`**Tu código único:** \`${code}\`\n\n📝 **Instrucciones:**\n1. Copia este código.\n2. Ve a tu perfil de Roblox y pégalo en tu **descripción**.\n3. Luego **responde a este mensaje** con tu nombre de usuario de Roblox.\n\n⏰ **Tienes 10 minutos** para completar el proceso. Si expira, deberás usar /verify nuevamente.`)
            .setColor('#00ff00');
        await dm.send({ embeds: [embed] });
    }
};
