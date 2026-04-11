const fs = require('fs');
const path = './data/data.json';

let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
    tickets: {},
    cooldowns: {}
};

function save() {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function canCreateTicket(userId) {
    const now = Date.now();

    if (data.tickets[userId]) {
        return { allowed: false, reason: "Ya tienes un ticket abierto." };
    }

    if (data.cooldowns[userId] && now < data.cooldowns[userId]) {
        return { allowed: false, reason: "Espera 5 minutos antes de crear otro ticket." };
    }

    return { allowed: true };
}

function registerTicket(userId, channelId) {
    data.tickets[userId] = channelId;
    save();
}

function closeTicket(userId) {
    delete data.tickets[userId];
    data.cooldowns[userId] = Date.now() + (5 * 60 * 1000);
    save();
}

module.exports = {
    canCreateTicket,
    registerTicket,
    closeTicket
};
