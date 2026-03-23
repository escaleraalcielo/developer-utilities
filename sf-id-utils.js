/**
 * Checks if a string is a valid Salesforce ID format (15 or 18 characters, alphanumeric).
 * @param {string} str
 * @returns {boolean}
 */
function isSalesforceId(str) {
    if (!str) return false;
    return /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(str);
}

/**
 * Converts a 15-character Salesforce ID to an 18-character case-safe ID.
 * Returns the original string if it's already 18 characters or not 15 characters.
 * @param {string} id15
 * @returns {string}
 */
function to18CharId(id15) {
    if (!id15) return "";
    id15 = id15.trim();

    if (id15.length === 18) return id15;
    if (id15.length !== 15) return id15;

    const CHECKSUM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
    let suffix = "";

    for (let i = 0; i < 3; i++) {
        let flags = 0;
        for (let j = 0; j < 5; j++) {
            const char = id15.charAt(i * 5 + j);
            if (char >= 'A' && char <= 'Z') {
                flags += (1 << j);
            }
        }
        suffix += CHECKSUM_CHARS.charAt(flags);
    }

    return id15 + suffix;
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isSalesforceId, to18CharId };
}
