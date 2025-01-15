const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
dotenv.config();

// Pobierz klucz z pliku .env
const ENCRYPTION_KEY = process.env.FERNET_ENCRYPTION_KEY;

function encryptPassword(password) {
    try {
        return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
    } catch (error) {
        console.error('Error encrypting password:', error);
        throw new Error('Encryption failed');
    }
}

function decryptPassword(encryptedPassword) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Error decrypting password:', error);
        throw new Error('Decryption failed');
    }
}

module.exports = { encryptPassword, decryptPassword };