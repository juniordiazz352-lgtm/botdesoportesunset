00);
        }

    } catch (error) {
        console.error('❌ Error en buttonHandler:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Error procesando el botón.',
                ephemeral: true
            });
        }
    }
};



