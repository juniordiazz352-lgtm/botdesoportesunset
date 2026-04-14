const fetch = require('node-fetch');
const fs = require('fs');

const codesPath = './data/verifyCodes.json';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos

function loadCodes() {
    if (!fs.existsSync(codesPath)) return {};
    return JSON.parse(fs.readFileSync(codesPath));
}

function saveCodes(codes) {
    fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2));
}

function generateCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function getOrCreateCode(userId) {
    let codes = loadCodes();
    const now = Date.now();
    if (!codes[userId]) {
        codes[userId] = {
            code: generateCode(),
            createdAt: now,
            robloxUser: null,
            verified: false
        };
        saveCodes(codes);
        return codes[userId].code;
    }
    const userData = codes[userId];
    if (!userData.verified && (now - userData.createdAt) > CODE_EXPIRY_MS) {
        userData.code = generateCode();
        userData.createdAt = now;
        saveCodes(codes);
    }
    return userData.code;
}

function markVerified(userId, robloxUsername) {
    let codes = loadCodes();
    if (codes[userId]) {
        codes[userId].verified = true;
        codes[userId].robloxUser = robloxUsername;
        saveCodes(codes);
        return true;
    }
    return false;
}

async function getRobloxUserId(username) {
    try {
        const res = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`);
        const data = await res.json();
        return data.data?.[0]?.id || null;
    } catch (e) { return null; }
}

async function getUserDescription(userId) {
    try {
        const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const data = await res.json();
        return data.description || '';
    } catch (e) { return ''; }
}

async function verifyCode(username, expectedCode) {
    const userId = await getRobloxUserId(username);
    if (!userId) return false;
    const description = await getUserDescription(userId);
    return description.includes(expectedCode);
}

module.exports = { loadCodes, saveCodes, getOrCreateCode, markVerified, verifyCode };
