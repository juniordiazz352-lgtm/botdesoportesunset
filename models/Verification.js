const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    robloxUser: { type: String, required: true },
    code: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Verification', verificationSchema);
