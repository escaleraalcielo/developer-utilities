// --- Pure helpers (browser + Node testable) ---

/**
 * Algorithms that match by HEX string length.
 * `length` is the number of hex characters (each = 4 bits).
 */
const HEX_ALGORITHMS = [
    { name: 'CRC-32', bits: 32, length: 8, confidence: 'medium', note: '32-bit cyclic redundancy check. Common for ZIP/PNG integrity.' },
    { name: 'FNV-1a-32', bits: 32, length: 8, confidence: 'low', note: 'Fast non-cryptographic 32-bit hash.' },
    { name: 'MurmurHash3-32', bits: 32, length: 8, confidence: 'low', note: 'Fast non-cryptographic 32-bit hash, common in big-data pipelines.' },

    { name: 'MD5', bits: 128, length: 32, confidence: 'high', note: '128-bit message digest. Common for file integrity checks; cryptographically broken.' },
    { name: 'NTLM', bits: 128, length: 32, confidence: 'medium', note: 'Windows NTLM password hash. Indistinguishable from MD5 by length alone.' },
    { name: 'MD4', bits: 128, length: 32, confidence: 'low', note: 'Legacy 128-bit hash. Predecessor to MD5; deprecated.' },
    { name: 'LM (LAN Manager)', bits: 128, length: 32, confidence: 'low', note: 'Legacy Windows LAN Manager password hash.' },
    { name: 'MD2', bits: 128, length: 32, confidence: 'low', note: 'Very old 128-bit hash. Rarely seen in modern systems.' },

    { name: 'SHA-1', bits: 160, length: 40, confidence: 'high', note: '160-bit Secure Hash Algorithm 1. Deprecated for security use.' },
    { name: 'RIPEMD-160', bits: 160, length: 40, confidence: 'medium', note: '160-bit RIPEMD. Used in Bitcoin addresses.' },
    { name: 'Haval-160', bits: 160, length: 40, confidence: 'low', note: 'Variable-round 160-bit Haval.' },
    { name: 'Tiger-160', bits: 160, length: 40, confidence: 'low', note: '160-bit Tiger hash (truncated Tiger-192).' },

    { name: 'Tiger-192', bits: 192, length: 48, confidence: 'medium', note: '192-bit Tiger hash. Common in peer-to-peer protocols (DC++, Kademlia).' },

    { name: 'SHA-224', bits: 224, length: 56, confidence: 'high', note: 'Truncated SHA-256 (FIPS 180-4).' },
    { name: 'SHA3-224', bits: 224, length: 56, confidence: 'medium', note: 'Keccak-based SHA-3 with 224-bit output.' },
    { name: 'Haval-224', bits: 224, length: 56, confidence: 'low', note: 'Variable-round 224-bit Haval.' },

    { name: 'SHA-256', bits: 256, length: 64, confidence: 'high', note: '256-bit SHA-2. The most common modern cryptographic digest.' },
    { name: 'SHA3-256', bits: 256, length: 64, confidence: 'medium', note: 'Keccak-based SHA-3 with 256-bit output.' },
    { name: 'BLAKE2s-256', bits: 256, length: 64, confidence: 'medium', note: 'BLAKE2 variant optimized for 32-bit platforms.' },
    { name: 'Haval-256', bits: 256, length: 64, confidence: 'low', note: 'Variable-round 256-bit Haval.' },
    { name: 'Snefru-256', bits: 256, length: 64, confidence: 'low', note: '256-bit Snefru by Ralph Merkle.' },

    { name: 'SHA-384', bits: 384, length: 96, confidence: 'high', note: 'Truncated SHA-512.' },
    { name: 'SHA3-384', bits: 384, length: 96, confidence: 'medium', note: 'Keccak-based SHA-3 with 384-bit output.' },

    { name: 'SHA-512', bits: 512, length: 128, confidence: 'high', note: '512-bit SHA-2.' },
    { name: 'SHA3-512', bits: 512, length: 128, confidence: 'medium', note: 'Keccak-based SHA-3 with 512-bit output.' },
    { name: 'BLAKE2b-512', bits: 512, length: 128, confidence: 'medium', note: 'BLAKE2 variant optimized for 64-bit platforms.' },
    { name: 'Whirlpool', bits: 512, length: 128, confidence: 'medium', note: 'ISO/IEC 10118-3 512-bit hash.' },
    { name: 'MD6', bits: 512, length: 128, confidence: 'low', note: '512-bit MD6 (NIST SHA-3 finalist, not selected).' }
];

/**
 * Algorithms that match by Base64 string length.
 * `length` is the exact number of base64 characters (including padding).
 */
const BASE64_ALGORITHMS = [
    { name: 'MD5 (Base64)', bits: 128, length: 24, confidence: 'high', note: '16 bytes encoded as 24 chars Base64 (== padding).' },
    { name: 'MD5 (Base64, no padding)', bits: 128, length: 22, confidence: 'medium', note: '16 bytes without padding (== stripped).' },
    { name: 'SHA-1 (Base64)', bits: 160, length: 28, confidence: 'high', note: '20 bytes encoded as 28 chars Base64 (= padding).' },
    { name: 'SHA-1 (Base64, no padding)', bits: 160, length: 26, confidence: 'medium', note: '20 bytes without padding (= stripped).' },
    { name: 'SHA-256 (Base64)', bits: 256, length: 44, confidence: 'high', note: '32 bytes encoded as 44 chars Base64 (= padding).' },
    { name: 'SHA-256 (Base64, no padding)', bits: 256, length: 43, confidence: 'medium', note: '32 bytes without padding (= stripped).' },
    { name: 'SHA-384 (Base64)', bits: 384, length: 64, confidence: 'high', note: '48 bytes encoded as 64 chars Base64 (no padding).' },
    { name: 'SHA-512 (Base64)', bits: 512, length: 88, confidence: 'high', note: '64 bytes encoded as 88 chars Base64 (== padding).' },
    { name: 'SHA-512 (Base64, no padding)', bits: 512, length: 86, confidence: 'medium', note: '64 bytes without padding (== stripped).' }
];

/**
 * Password-hash formats identified by prefix patterns.
 */
const PREFIX_PATTERNS = [
    { regex: /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/, name: 'bcrypt', confidence: 'high', note: 'OpenBSD bcrypt. Includes cost factor (e.g. $2b$10$... = cost 10).' },
    { regex: /^\$argon2id\$/, name: 'Argon2id', confidence: 'high', note: 'Argon2id — winner of the Password Hashing Competition. Memory-hard.' },
    { regex: /^\$argon2i\$/, name: 'Argon2i', confidence: 'high', note: 'Argon2i — side-channel resistant variant.' },
    { regex: /^\$argon2d\$/, name: 'Argon2d', confidence: 'high', note: 'Argon2d — data-dependent variant.' },
    { regex: /^\$7\$/, name: 'scrypt (crypt)', confidence: 'high', note: 'scrypt encoded with the glibc crypt(3) prefix.' },
    { regex: /^\$pbkdf2[-_]sha256\$/i, name: 'PBKDF2-SHA256 (passlib)', confidence: 'high', note: 'PBKDF2 with HMAC-SHA256, passlib format.' },
    { regex: /^\$pbkdf2[-_]sha512\$/i, name: 'PBKDF2-SHA512 (passlib)', confidence: 'high', note: 'PBKDF2 with HMAC-SHA512, passlib format.' },
    { regex: /^\$pbkdf2[-_]sha1\$/i, name: 'PBKDF2-SHA1 (passlib)', confidence: 'high', note: 'PBKDF2 with HMAC-SHA1, passlib format.' },
    { regex: /^\$1\$/, name: 'MD5-crypt (md5crypt)', confidence: 'high', note: 'Legacy $1$ Unix crypt, 1000 rounds of MD5.' },
    { regex: /^\$5\$/, name: 'SHA-256-crypt (sha256crypt)', confidence: 'high', note: '$5$ Unix crypt, 5000 rounds of SHA-256.' },
    { regex: /^\$6\$/, name: 'SHA-512-crypt (sha512crypt)', confidence: 'high', note: '$6$ Unix crypt, 5000 rounds of SHA-512.' },
    { regex: /^\$y\$/, name: 'Yescrypt', confidence: 'medium', note: 'Modern scrypt successor. Default on recent Fedora/RHEL.' },
    { regex: /^\$P\$/, name: 'phpass', confidence: 'high', note: 'phpass portable hash — used by WordPress and phpBB.' },
    { regex: /^\$H\$/, name: 'phpass (alt)', confidence: 'high', note: 'phpass portable hash, $H$ variant.' },
    { regex: /^\*[0-9a-fA-F]{40}$/, name: 'MySQL 4.1+ (SHA-1)', confidence: 'high', note: 'MySQL password hash (SHA-1 based, * + 40 hex).' },
    { regex: /^\*[0-9a-fA-F]{16}$/, name: 'MySQL 3.23 / 4.0', confidence: 'high', note: 'Old MySQL 3.23/4.0 password hash (* + 16 hex).' }
];

/** JWT: three base64url segments separated by dots. */
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

/**
 * Identify a likely algorithm for a hash-like string.
 *
 * @param {string} rawInput
 * @returns {{
 *   ok: true,
 *   input: string,
 *   normalized: string,
 *   format: 'hex'|'base64'|'prefixed'|'jwt',
 *   bits: number|null,
 *   bytes: number|null,
 *   matches: Array<{name: string, bits: number|null, confidence: 'high'|'medium'|'low', note: string}>
 * } | {
 *   ok: false,
 *   error: string,
 *   input: string|null,
 *   format: 'unknown'
 * }}
 */
function identifyHash(rawInput) {
    if (typeof rawInput !== 'string') {
        return { ok: false, error: 'Input must be a string.', input: null, format: 'unknown' };
    }
    const trimmed = rawInput.trim();
    if (!trimmed) {
        return { ok: false, error: 'Input is empty.', input: rawInput, format: 'unknown' };
    }

    // 1. Prefix patterns (bcrypt, argon2, etc.) — most specific.
    for (const p of PREFIX_PATTERNS) {
        if (p.regex.test(trimmed)) {
            return {
                ok: true,
                input: rawInput,
                normalized: trimmed,
                format: 'prefixed',
                bits: null,
                bytes: null,
                matches: [{
                    name: p.name,
                    bits: null,
                    confidence: p.confidence,
                    note: p.note
                }]
            };
        }
    }

    // 2. JWT pattern.
    if (JWT_REGEX.test(trimmed)) {
        const segments = trimmed.split('.');
        const sigLen = segments[2].length;
        let sigBits = null;
        // Common JWT signature sizes by encoding
        if (sigLen === 43 || sigLen === 44) sigBits = 256;
        else if (sigLen === 63 || sigLen === 64) sigBits = 384;
        else if (sigLen === 86 || sigLen === 88) sigBits = 512;
        else if (sigLen === 27 || sigLen === 28) sigBits = 160;

        return {
            ok: true,
            input: rawInput,
            normalized: trimmed,
            format: 'jwt',
            bits: sigBits,
            bytes: null,
            matches: [{
                name: 'JWT (JSON Web Token)',
                bits: sigBits,
                confidence: 'high',
                note: 'Three base64url segments: header.payload.signature. Decode with a JWT library to identify the algorithm (HS256/RS256/ES256/...).'
            }]
        };
    }

    // 3. Hex string.
    const hexClean = trimmed.replace(/\s+/g, '');
    if (/^[0-9a-fA-F]+$/.test(hexClean) && hexClean.length % 2 === 0) {
        const bits = hexClean.length * 4;
        const matches = HEX_ALGORITHMS
            .filter(a => a.length === hexClean.length)
            .slice()
            .sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]);
        return {
            ok: true,
            input: rawInput,
            normalized: hexClean.toLowerCase(),
            format: 'hex',
            bits,
            bytes: hexClean.length / 2,
            matches
        };
    }

    // 4. Base64 string. Require at least 8 chars (smallest meaningful hash is ~16 bytes).
    const b64Clean = trimmed.replace(/\s+/g, '');
    if (b64Clean.length >= 8 && /^[A-Za-z0-9+/]+={0,2}$/.test(b64Clean) && b64Clean.length % 4 !== 1) {
        const padding = (b64Clean.match(/=+$/) || [''])[0].length;
        const bytes = (b64Clean.length / 4) * 3 - padding;
        const bits = bytes * 8;
        const matches = BASE64_ALGORITHMS
            .filter(a => a.length === b64Clean.length)
            .slice()
            .sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]);
        return {
            ok: true,
            input: rawInput,
            normalized: b64Clean,
            format: 'base64',
            bits,
            bytes,
            matches
        };
    }

    return {
        ok: false,
        error: 'Unrecognized format. Expected hex (0-9, a-f), Base64, JWT, or a known hash prefix (e.g. $2b$, $argon2id$).',
        input: rawInput,
        format: 'unknown'
    };
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HEX_ALGORITHMS,
        BASE64_ALGORITHMS,
        PREFIX_PATTERNS,
        identifyHash
    };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.HEX_ALGORITHMS = HEX_ALGORITHMS;
    window.BASE64_ALGORITHMS = BASE64_ALGORITHMS;
    window.PREFIX_PATTERNS = PREFIX_PATTERNS;
    window.identifyHash = identifyHash;
}

// --- DOM Glue ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const inputEl = document.getElementById('inputHash');
        const formatBadgeEl = document.getElementById('formatBadge');
        const lengthBadgeEl = document.getElementById('lengthBadge');
        const normalizedBadgeEl = document.getElementById('normalizedBadge');
        const bestMatchEl = document.getElementById('bestMatch');
        const othersListEl = document.getElementById('othersList');
        const unknownEl = document.getElementById('unknownMessage');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyNormalizedBtn = document.getElementById('copyNormalizedBtn');

        const CONFIDENCE_BADGE = {
            high: { cls: 'bg-success', icon: 'bi-check-circle-fill' },
            medium: { cls: 'bg-warning text-dark', icon: 'bi-dash-circle-fill' },
            low: { cls: 'bg-secondary', icon: 'bi-question-circle-fill' }
        };

        function escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function clearResults() {
            formatBadgeEl.textContent = '';
            formatBadgeEl.className = 'badge d-none';
            lengthBadgeEl.textContent = '';
            lengthBadgeEl.className = 'badge d-none';
            normalizedBadgeEl.textContent = '';
            normalizedBadgeEl.className = 'badge d-none';
            copyNormalizedBtn.classList.add('d-none');
            bestMatchEl.innerHTML = '';
            othersListEl.innerHTML = '';
            unknownEl.classList.add('d-none');
        }

        function showUnknown(msg) {
            clearResults();
            unknownEl.textContent = msg;
            unknownEl.classList.remove('d-none');
        }

        function showResults(res) {
            unknownEl.classList.add('d-none');

            // Format badge
            const fmtLabel = {
                hex: 'Hex',
                base64: 'Base64',
                prefixed: 'Prefixed',
                jwt: 'JWT'
            }[res.format] || res.format;
            formatBadgeEl.textContent = 'Format: ' + fmtLabel;
            formatBadgeEl.className = 'badge me-2 bg-info bg-opacity-25 text-info';

            // Length badge
            if (res.bits != null) {
                lengthBadgeEl.textContent = res.bits + ' bits (' + res.bytes + ' bytes)';
            } else if (res.bytes != null) {
                lengthBadgeEl.textContent = res.bytes + ' bytes';
            } else {
                lengthBadgeEl.textContent = '';
            }
            lengthBadgeEl.className = res.bits != null || res.bytes != null
                ? 'badge me-2 bg-secondary bg-opacity-25 text-secondary'
                : 'badge d-none';

            // Normalized badge
            if (res.normalized && res.normalized !== res.input.trim()) {
                normalizedBadgeEl.textContent = 'normalized';
                normalizedBadgeEl.className = 'badge bg-secondary bg-opacity-10 text-secondary';
                copyNormalizedBtn.classList.remove('d-none');
            } else {
                normalizedBadgeEl.className = 'badge d-none';
                copyNormalizedBtn.classList.add('d-none');
            }

            // Best match + others
            if (!res.matches || res.matches.length === 0) {
                bestMatchEl.innerHTML = '<div class="alert alert-warning mb-0"><i class="bi bi-question-circle me-2"></i>' +
                    'Recognized as <strong>' + escapeHtml(fmtLabel) + '</strong> but the length doesn\'t match any known algorithm.' +
                    '</div>';
                othersListEl.innerHTML = '';
                return;
            }

            const top = res.matches[0];
            const badge = CONFIDENCE_BADGE[top.confidence] || CONFIDENCE_BADGE.low;
            bestMatchEl.innerHTML =
                '<div class="d-flex align-items-start gap-3 p-3 rounded" style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3);">' +
                '<i class="bi ' + badge.icon + ' fs-3 text-info"></i>' +
                '<div class="flex-grow-1">' +
                '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                '<h4 class="h5 text-white mb-0">' + escapeHtml(top.name) + '</h4>' +
                '<span class="badge ' + badge.cls + '">' + top.confidence + ' confidence</span>' +
                (top.bits != null ? '<span class="badge bg-secondary bg-opacity-25 text-secondary">' + top.bits + ' bits</span>' : '') +
                '</div>' +
                '<p class="text-secondary mb-0 mt-2 small">' + escapeHtml(top.note) + '</p>' +
                '</div>' +
                '</div>';

            if (res.matches.length > 1) {
                const others = res.matches.slice(1).map(m => {
                    const b = CONFIDENCE_BADGE[m.confidence] || CONFIDENCE_BADGE.low;
                    return (
                        '<li class="list-group-item bg-transparent border-secondary border-opacity-10 d-flex align-items-start gap-3">' +
                        '<i class="bi ' + b.icon + ' text-secondary mt-1"></i>' +
                        '<div class="flex-grow-1">' +
                        '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                        '<strong class="text-white">' + escapeHtml(m.name) + '</strong>' +
                        '<span class="badge ' + b.cls + '">' + m.confidence + '</span>' +
                        (m.bits != null ? '<span class="badge bg-secondary bg-opacity-25 text-secondary small">' + m.bits + ' bits</span>' : '') +
                        '</div>' +
                        '<div class="text-secondary small mt-1">' + escapeHtml(m.note) + '</div>' +
                        '</div>' +
                        '</li>'
                    );
                }).join('');
                othersListEl.innerHTML =
                    '<h6 class="text-secondary small fw-bold text-uppercase mt-4 mb-2">Other candidates (' + (res.matches.length - 1) + ')</h6>' +
                    '<ul class="list-group list-group-flush">' + others + '</ul>';
            } else {
                othersListEl.innerHTML = '';
            }
        }

        function analyze() {
            const raw = inputEl.value;
            if (!raw.trim()) {
                clearResults();
                return;
            }
            const res = identifyHash(raw);
            if (res.ok) {
                showResults(res);
            } else {
                showUnknown(res.error);
            }
        }

        inputEl.addEventListener('input', analyze);

        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            clearResults();
            inputEl.focus();
        });

        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm('This will overwrite your current input. Do you want to continue?');
                if (!proceed) return;
            }
            // Cycle through samples so the user can see several formats
            const samples = window.SampleData.hashIdentifier;
            const idxAttr = loadSampleBtn.getAttribute('data-sample-idx') || '0';
            let idx = parseInt(idxAttr, 10);
            const keys = Object.keys(samples);
            const key = keys[idx % keys.length];
            loadSampleBtn.setAttribute('data-sample-idx', String(idx + 1));
            inputEl.value = samples[key];
            analyze();
        });

        copyNormalizedBtn.addEventListener('click', () => {
            const res = identifyHash(inputEl.value);
            if (res.ok && res.normalized) {
                copyToClipboard(res.normalized, 'Normalized hash copied!');
            }
        });
    });
}


function showToast(message) {
    message = message || 'Copied to clipboard!';
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    let toastEl = document.getElementById('globalToast');
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'globalToast';
        toastEl.className = 'toast align-items-center text-white bg-success border-0';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.innerHTML =
            '<div class="d-flex>' +
            '<div class="toast-body"><i class="bi bi-check-circle me-2"></i> <span id="toastMessage"></span></div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
            '</div>';
        toastContainer.appendChild(toastEl);
    }
    document.getElementById('toastMessage').innerText = message;
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }
}

function fallbackCopyTextToClipboard(text, successMessage) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);display:flex;justify-content:center;align-items:center;z-index:10000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
    const container = document.createElement('div');
    container.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)';
    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = 'margin:0 0 16px;color:#333;font-size:14px;text-align:center';
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'width:100%;min-height:150px;padding:12px;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box;margin-bottom:16px';
    textarea.readOnly = true;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'background:#0d6efd;color:white;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;display:block;margin:0 auto';
    const closeOverlay = () => { document.body.removeChild(overlay); document.removeEventListener('keydown', handleEscape); };
    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
    const handleEscape = e => { if (e.key === 'Escape') closeOverlay(); };
    document.addEventListener('keydown', handleEscape);
    container.appendChild(instruction);
    container.appendChild(textarea);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    textarea.focus();
    textarea.select();
}

function copyToClipboard(text, successMessage) {
    successMessage = successMessage || 'Copied to clipboard!';
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast(successMessage)).catch(() => fallbackCopyTextToClipboard(text, successMessage));
    } else {
        fallbackCopyTextToClipboard(text, successMessage);
    }
}