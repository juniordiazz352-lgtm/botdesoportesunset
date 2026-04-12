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

const Ticket = mongoose.model('Ticket', ticketSchema);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB conectado');
    } catch (err) {
        console.error('❌ Error MongoDB:', err);
    }
}

module.exports = { connectDB, Ticket };
