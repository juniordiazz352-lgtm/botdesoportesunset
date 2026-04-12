const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { loadCodes, saveCodes, generateCode, verifyCode } = require('../../utils/robloxVerify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verifica tu cuenta de Roblox'),

    async execute(interaction) {
        // Responder de forma efímera (solo él ve)
        await interaction.reply({ content: '✅ Te he enviado un mensaje directo con las instrucciones.', ephemeral: true });

        const user = interaction.user;
        const dmChannel = await user.createDM().catch(() => null);
        if (!dmChannel) {
            return interaction.followUp({ content: '❌ No pude enviarte DM. Habilita los mensajes directos.', ephemeral: true });
        }

        // Cargar o crear código para este usuario
        let codes = loadCodes();
        if (!codes[user.id]) {
            codes[user.id] = { code: generateCode(), robloxUser: null, verified: false };
            saveCodes(codes);
        }
        const currentCode = codes[user.id].code;

        const embed = new EmbedBuilder()
            .setTitle('🔐 Verificación Roblox')
            .setDescription(`**Paso 1:** Copia este código:\n\`${currentCode}\`\n\n**Paso 2:** Ve a tu perfil de Roblox y pégalo en tu **descripción**.\n\n**Paso 3:** Una vez hecho, responde a este mensaje con tu **nombre de usuario de Roblox**.\n\nEjemplo: \`JuanPerez123\``)
            .setColor('#00ff00');

        await dmChannel.send({ embeds: [embed] });

        // Esperar respuesta del usuario en DM (se maneja en el evento messageCreate)
    }
};
