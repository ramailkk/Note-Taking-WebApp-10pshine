const crypto = require('crypto');

/**
 * Encryption utility for protecting sensitive note content
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const SALT_LENGTH = 32;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from user ID and server secret
 * @param {number} userId - User ID for per-user key isolation
 * @returns {Buffer} - Derived encryption key
 */
function deriveKey(userId) {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error('ENCRYPTION_SECRET not configured');
    }

    // Use userId as salt component for per-user keys
    const salt = crypto.createHash('sha256')
        .update(`${userId}:${secret}`)
        .digest();

    // Derive key using PBKDF2
    return crypto.pbkdf2Sync(
        secret,
        salt,
        100000, // iterations
        KEY_LENGTH,
        'sha256'
    );
}

/**
 * Encrypt note content
 * @param {string} plaintext - Content to encrypt
 * @param {number} userId - User ID for key derivation
 * @returns {Object} - { encryptedData: string, iv: string, authTag: string }
 */
function encryptContent(plaintext, userId) {
    if (!plaintext) {
        return { encryptedData: '', iv: '', authTag: '' };
    }

    try {
        const key = deriveKey(userId);
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encryptedData: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    } catch (err) {
        throw new Error(`Encryption failed: ${err.message}`);
    }
}

/**
 * Decrypt note content
 * @param {string} encryptedData - Encrypted content
 * @param {string} ivHex - Initialization vector (hex string)
 * @param {string} authTagHex - Authentication tag (hex string)
 * @param {number} userId - User ID for key derivation
 * @returns {string} - Decrypted plaintext
 */
function decryptContent(encryptedData, ivHex, authTagHex, userId) {
    if (!encryptedData) {
        return '';
    }

    try {
        const key = deriveKey(userId);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (err) {
        throw new Error(`Decryption failed: ${err.message}`);
    }
}

module.exports = {
    encryptContent,
    decryptContent
};
