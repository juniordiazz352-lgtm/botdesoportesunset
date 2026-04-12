const mongoose = require('mongoose');

const staffStatSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    ticketsResueltos: { type: Number, default: 0 },
    ticketsReclamados: { type: Number, default: 0 },
    tiempoTotalSegundos: { type: Number, default: 0 },
    ratingSuma: { type: Number, default: 0 },
    ratingCantidad: { type: Number, default: 0 },
    warnsEmitidos: { type: Number, default: 0 }
});

module.exports = mongoose.model('StaffStat', staffStatSchema);
