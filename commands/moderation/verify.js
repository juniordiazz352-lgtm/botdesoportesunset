const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { loadCodes, saveCodes, generateCode, verifyCode } = require('../../utils/robloxVerify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verifica tu cuenta de Roblox'),

    async execute(interaction) {
        await interaction.reply({ content: '✅ Revisa tus mensajes directos.', ephemeral: true });

        const user = interaction.user;
        const dm = await user.createDM().catch(() => null);
        if (!dm) return;

        let codes = loadCodes();
        if (!codes[user.id]) {
            codes[user.id] = { code: generateCode(), robloxUser: null, verified: false };
            saveCodes(codes);
        }

        const embed = new EmbedBuilder()
            .setTitle('🔐 Verificación Roblox')
            .setDescription(`**Código:** \`${codes[user.id].code}\`\n\nPon este código en tu descripción de Roblox y luego responde a este mensaje con tu usuario de Roblox.`)
            .setColor('#00ff00');
        await dm.send({ embeds: [embed] });
    }
};
