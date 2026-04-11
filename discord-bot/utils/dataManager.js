/**
 * utils/dataManager.js
 * Gestiona la persistencia de datos en archivos JSON.
 * Reemplaza una BD para proyectos pequeños/medianos.
 */

const fs = require('fs-extra');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');
const DATA_PATH   = path.join(__dirname, '../data/data.json');
const FORMS_PATH  = path.join(__dirname, '../data/forms.json');

// ── Estructura inicial de los archivos ──────────────────────
const DEFAULT_CONFIG = {
  logChannel:      null,  // ID del canal de logs
  staffRole:       null,  // ID del rol de staff
  ticketCategory:  null,  // ID de la categoría de tickets
  formChannel:     null,  // ID del canal de respuestas de formularios
};

const DEFAULT_DATA = {
  tickets: {},        // { channelId: { userId, category, openedAt, claimedBy, status } }
  ticketCounter: {},  // { category: numero }
  panels: [],         // Paneles de tickets creados
  formPanels: [],     // Paneles de formularios creados
  cooldowns: {},      // { userId: timestamp }
  spamTracker: {},    // { userId: [timestamps] }
  ratings: [],        // { ticketId, userId, staffId, rating, timestamp }
};

const DEFAULT_FORMS = {
  forms: [],          // { id, title, questions[], approveChannel, rejectChannel }
};

// ── Inicializar archivos si no existen ──────────────────────
function initData() {
  fs.ensureFileSync(CONFIG_PATH);
  fs.ensureFileSync(DATA_PATH);
  fs.ensureFileSync(FORMS_PATH);

  if (!fs.readJsonSync(CONFIG_PATH, { throws: false }))
    fs.writeJsonSync(CONFIG_PATH, DEFAULT_CONFIG, { spaces: 2 });

  if (!fs.readJsonSync(DATA_PATH, { throws: false }))
    fs.writeJsonSync(DATA_PATH, DEFAULT_DATA, { spaces: 2 });

  if (!fs.readJsonSync(FORMS_PATH, { throws: false }))
    fs.writeJsonSync(FORMS_PATH, DEFAULT_FORMS, { spaces: 2 });

  console.log('✅ Datos inicializados correctamente.');
}

// ── Helpers genéricos ────────────────────────────────────────
function getConfig()       { return fs.readJsonSync(CONFIG_PATH,  { throws: false }) || DEFAULT_CONFIG; }
function saveConfig(data)  { fs.writeJsonSync(CONFIG_PATH, data,  { spaces: 2 }); }
function getData()         { return fs.readJsonSync(DATA_PATH,    { throws: false }) || DEFAULT_DATA; }
function saveData(data)    { fs.writeJsonSync(DATA_PATH, data,    { spaces: 2 }); }
function getForms()        { return fs.readJsonSync(FORMS_PATH,   { throws: false }) || DEFAULT_FORMS; }
function saveForms(data)   { fs.writeJsonSync(FORMS_PATH, data,   { spaces: 2 }); }

// ── Tickets ──────────────────────────────────────────────────
function getTicket(channelId) {
  const data = getData();
  return data.tickets[channelId] || null;
}

function saveTicket(channelId, ticketData) {
  const data = getData();
  data.tickets[channelId] = ticketData;
  saveData(data);
}

function removeTicket(channelId) {
  const data = getData();
  delete data.tickets[channelId];
  saveData(data);
}

function getNextTicketNumber(category) {
  const data = getData();
  if (!data.ticketCounter[category]) data.ticketCounter[category] = 0;
  data.ticketCounter[category]++;
  saveData(data);
  return String(data.ticketCounter[category]).padStart(4, '0');
}

function getUserActiveTicket(userId) {
  const data = getData();
  return Object.entries(data.tickets).find(([, t]) => t.userId === userId && t.status !== 'closed') || null;
}

// ── Anti-Spam ────────────────────────────────────────────────
const SPAM_LIMIT    = 3;    // Máximo de intentos
const SPAM_WINDOW   = 5 * 60 * 1000; // 5 minutos en ms

function checkSpam(userId) {
  const data = getData();
  const now = Date.now();
  if (!data.spamTracker[userId]) data.spamTracker[userId] = [];

  // Limpiar intentos viejos fuera de la ventana
  data.spamTracker[userId] = data.spamTracker[userId].filter(t => now - t < SPAM_WINDOW);

  if (data.spamTracker[userId].length >= SPAM_LIMIT) {
    saveData(data);
    return false; // Bloqueado
  }

  data.spamTracker[userId].push(now);
  saveData(data);
  return true; // Permitido
}

// ── Formularios ──────────────────────────────────────────────
function getForm(formId) {
  const forms = getForms();
  return forms.forms.find(f => f.id === formId) || null;
}

function saveForm(formData) {
  const forms = getForms();
  const idx = forms.forms.findIndex(f => f.id === formData.id);
  if (idx >= 0) forms.forms[idx] = formData;
  else forms.forms.push(formData);
  saveForms(forms);
}

function getAllForms() {
  return getForms().forms;
}

module.exports = {
  initData,
  getConfig, saveConfig,
  getData, saveData,
  getForms, saveForms,
  getTicket, saveTicket, removeTicket, getNextTicketNumber, getUserActiveTicket,
  checkSpam,
  getForm, saveForm, getAllForms,
};
