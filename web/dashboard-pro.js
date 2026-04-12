const express = require('express');
const { Ticket } = require('../utils/database');
const router = express.Router();

router.get('/', async (req, res) => {
    const tickets = await Ticket.find({ status: 'open' });
    let html = `<!DOCTYPE html><html><head><title>Dashboard PRO</title><style>
        body { background: #1a1a2e; color: white; font-family: Arial; }
        .ticket { background: #16213e; margin: 10px; padding: 15px; border-radius: 8px; }
        button { background: #e94560; border: none; padding: 5px 10px; color: white; cursor: pointer; }
    </style></head><body><h1>📊 Tickets Activos</h1>`;
    tickets.forEach(t => {
        html += `<div class="ticket">
            <strong>${t.ticketId}</strong> - ${t.category}<br>
            Usuario: ${t.userTag}<br>
            Prioridad: ${t.priority}<br>
            <button onclick="fetch('/api/close/${t.channelId}')">Cerrar</button>
        </div>`;
    });
    html += `<script>function close(id){ fetch('/api/close/'+id).then(()=>location.reload()); }</script></body></html>`;
    res.send(html);
});

router.get('/api/stats', async (req, res) => {
    const stats = await Ticket.aggregate([{ $group: { _id: '$claimedBy', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }]);
    res.json(stats);
});

module.exports = router;
