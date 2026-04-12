const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateCode } = require('../../utils/robloxVerify');

module.exports = {
    data: new SlashCommandBuilder().setName('verify').setDescription('Verifica tu cuenta de Roblox'),
    async execute(interaction) {
        await interaction.reply({ content: '✅ Revisa tus mensajes directos.', ephemeral: true });
        const dm = await interaction.user.createDM().catch(() => null);
        if (!dm) return;
        const code = getOrCreateCode(interaction.user.id);
        const embed = new EmbedBuilder()
            .setTitle('🔐 Verificación Roblox')
            .setDescription(`**Código:** \`${code}\`\n\nPonlo en tu descripción de Roblox y responde a este mensaje con tu usuario.`)
            .setColor('#00ff00');
        await dm.send({ embeds: [embed] });
    }
};
