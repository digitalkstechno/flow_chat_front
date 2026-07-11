import CryptoJS from 'crypto-js';

// Ensure the same KEY is used as in the backend
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '3b65d1910730ba3a430a5d266b03dcbfd9918913d68fec02d301b8fbd158c7a6';

export const decrypt = (text: string): string => {
    if (!text || text.indexOf(':') === -1) return text;
    try {
        const parts = text.split(':');
        const ivHex = parts.shift() || '';
        const encryptedHex = parts.join(':');

        const iv = CryptoJS.enc.Hex.parse(ivHex);
        const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
        const encrypted = CryptoJS.enc.Hex.parse(encryptedHex);

        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: encrypted
        });

        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error('Decryption failed', e);
        return '********';
    }
};

const USER_CRYPTO_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY || 'gdfgd';

export const decryptUserPassword = (encryptedData: string): string => {
    if (!encryptedData) return 'Not set';
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, USER_CRYPTO_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || '********';
    } catch (e) {
        console.error('User password decryption failed', e);
        return '********';
    }
};
