module.exports = async (interaction) => {
    try {
        if (interaction.customId === 'form_select') {
            const selected = interaction.values[0];
            await interaction.reply({ 
                content: `✅ Seleccionaste: ${selected}\nPronto recibirás el formulario por DM.`,
                ephemeral: true 
            });
        }
    } catch (error) {
        console.error('❌ Error en selectMenuHandler:', error);
    }
};
