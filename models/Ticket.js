const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: String,
    category: String,
    userId: String,
    userTag: String,
    channelId: String,
    status: { type: String, default: 'open' },
    priority: { type: String, default: 'media' },
    createdAt: Date,
    closedAt: Date,
    closedBy: String,
    claimedBy: String,
    claimedAt: Date,
    rating: Number,
    duration: Number
});

module.exports = mongoose.model('Ticket', ticketSchema);
