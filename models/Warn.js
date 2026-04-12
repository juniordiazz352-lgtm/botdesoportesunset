const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    warnedBy: { type: String, required: true },
    reason: { type: String, default: 'Sin razón' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Warn', warnSchema);
