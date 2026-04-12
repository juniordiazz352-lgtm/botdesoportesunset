const fetch = require('node-fetch');
const fs = require('fs');

const codesPath = './data/verifyCodes.json';

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

async function getRobloxUserId(username) {
    const res = await fetch(`https://users.roblox.com/v1/users/search?keyword=${username}&limit=1`);
    const data = await res.json();
    return data.data?.[0]?.id || null;
}

async function getUserDescription(userId) {
    const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const data = await res.json();
    return data.description || '';
}

async function verifyCode(username, expectedCode) {
    const userId = await getRobloxUserId(username);
    if (!userId) return false;
    const description = await getUserDescription(userId);
    return description.includes(expectedCode);
}

module.exports = { loadCodes, saveCodes, generateCode, verifyCode };
