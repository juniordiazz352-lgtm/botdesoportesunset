const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Warn = require('../models/Warn');
const StaffStat = require('../models/StaffStat');
const Verification = require('../models/Verification');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB conectado');
    } catch (err) {
        console.error('❌ Error MongoDB:', err);
    }
}

module.exports = { connectDB, Ticket, Warn, StaffStat, Verification };
