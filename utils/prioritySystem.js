const priorities = {
    baja: { color: '#00ff00', timeLimit: 86400000, name: '🟢 Baja' },      // 24h
    media: { color: '#ffff00', timeLimit: 21600000, name: '🟡 Media' },     // 6h
    alta: { color: '#ff0000', timeLimit: 3600000, name: '🔴 Alta' }         // 1h
};

function getPriorityEmoji(priority) {
    return priorities[priority]?.name.split(' ')[0] || '🟢';
}

module.exports = { priorities, getPriorityEmoji };
