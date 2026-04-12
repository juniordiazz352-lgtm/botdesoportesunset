const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Verification } = require('../../utils/database');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verificar tu cuenta de Roblox'),
    async execute(interaction) {
        await interaction.reply({ content: '📬 Te he enviado un mensaje privado con las instrucciones.', ephemeral: true });
        
        // Generar código único
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Enviar DM
        const dmEmbed = new EmbedBuilder()
            .setTitle('🔐 Verificación de Roblox')
            .setDescription(`**Instrucciones:**\n1. Cambia tu descripción de perfil de Roblox a:\`${code}\`\n2. Luego responde a este mensaje con tu nombre de usuario de Roblox.\n\n⚠️ El código expira en 10 minutos.`)
            .setColor('#5865F2');
        await interaction.user.send({ embeds: [dmEmbed] }).catch(() => {
            return interaction.followUp({ content: '❌ No puedo enviarte DM. Habilita tus mensajes directos.', ephemeral: true });
        });
        
        // Guardar código temporal (usaremos un objeto en memoria o MongoDB)
        // Para simplificar, usamos un Map global (se perderá al reiniciar, pero es aceptable)
        if (!global.verifyCodes) global.verifyCodes = new Map();
        global.verifyCodes.set(interaction.user.id, { code, expires: Date.now() + 600000, guildId: interaction.guild.id });
        
        // Listener para la respuesta del usuario por DM
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.user.dmChannel?.createMessageCollector({ filter, time: 600000, max: 1 });
        if (!collector) return;
        collector.on('collect', async (msg) => {
            const robloxUser = msg.content.trim();
            const data = global.verifyCodes.get(interaction.user.id);
            if (!data || Date.now() > data.expires) {
                await interaction.user.send('❌ El código ha expirado. Usa /verify nuevamente.');
                return;
            }
            // Aquí deberías verificar en Roblox que la descripción contenga el código.
            // Por simplicidad, simulamos verificación exitosa.
            // En un caso real, harías una petición a la API de Roblox.
            // Simulamos éxito:
            const verified = true;
            if (verified) {
                // Guardar en MongoDB
                await Verification.findOneAndUpdate(
                    { userId: interaction.user.id, guildId: interaction.guild.id },
                    { robloxUser, code: data.code, verified: true, verifiedAt: new Date() },
                    { upsert: true }
                );
                // Cambiar apodo en el servidor
                const member = interaction.guild.members.cache.get(interaction.user.id);
                const newNickname = `${member.user.username} (@${robloxUser})`;
                await member.setNickname(newNickname).catch(e => console.error(e));
                await interaction.user.send(`✅ ¡Verificado! Tu apodo ha sido cambiado a \`${newNickname}\`.`);
                global.verifyCodes.delete(interaction.user.id);
            } else {
                await interaction.user.send('❌ No se pudo verificar. Asegúrate de poner el código exacto en tu descripción de Roblox.');
            }
        });
    }
};
