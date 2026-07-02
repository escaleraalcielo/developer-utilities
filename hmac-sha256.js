// --- Pure Helpers (browser + Node testable) ---

/**
 * Convert an ArrayBuffer to a lowercase hex string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
        out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
}

/**
 * Convert an ArrayBuffer to a Base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
}

/**
 * Parse a hex string into a Uint8Array. Throws if not valid hex.
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string') throw new TypeError('hex must be a string');
    const cleaned = hex.replace(/\s+/g, '');
    if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(cleaned)) {
        throw new Error('Invalid hex string');
    }
    const out = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(cleaned.substr(i * 2, 2), 16);
    }
    return out;
}

/**
 * Constant-time string comparison (avoids timing leaks on signature compare).
 * Returns true only when lengths match and every byte is equal.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

/**
 * Decode a secret string into bytes according to the chosen encoding.
 * - 'utf8': TextEncoder over the raw string (default, matches typical webhook secrets).
 * - 'hex': parse as hex bytes (must be even length, valid hex).
 *
 * @param {string} secret
 * @param {'utf8'|'hex'} encoding
 * @returns {Uint8Array}
 */
function decodeSecret(secret, encoding) {
    if (typeof secret !== 'string') throw new TypeError('secret must be a string');
    if (encoding === 'hex') return hexToBytes(secret);
    return new TextEncoder().encode(secret);
}

/**
 * Compute HMAC-SHA256 of a UTF-8 string using the given secret.
 *
 * @param {string} message - the message to sign.
 * @param {string} secret - the shared secret.
 * @param {'utf8'|'hex'} [keyEncoding='utf8']
 * @returns {Promise<ArrayBuffer>} the 32-byte HMAC digest.
 */
async function hmacSha256OfString(message, secret, keyEncoding = 'utf8') {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API is not available in this environment.');
    }
    if (!secret) throw new Error('Secret key is required.');

    const keyBytes = decodeSecret(secret, keyEncoding);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

    const msgBytes = new TextEncoder().encode(message);
    return crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
}

/**
 * Compute HMAC-SHA256 of an ArrayBuffer / Uint8Array using the given secret.
 *
 * @param {ArrayBuffer | Uint8Array} data
 * @param {string} secret
 * @param {'utf8'|'hex'} [keyEncoding='utf8']
 * @returns {Promise<ArrayBuffer>}
 */
async function hmacSha256OfBuffer(data, secret, keyEncoding = 'utf8') {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API is not available in this environment.');
    }
    if (!secret) throw new Error('Secret key is required.');

    const keyBytes = decodeSecret(secret, keyEncoding);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

    return crypto.subtle.sign('HMAC', cryptoKey, data);
}

/**
 * Verify a known HMAC-SHA256 signature against the computed one.
 * Returns one of: 'match' | 'mismatch' | 'invalid-signature' | 'unsupported-format' | 'missing-secret'.
 *
 * - 'match': the expected signature equals the computed signature in the same format.
 * - 'mismatch': both are well-formed but differ.
 * - 'invalid-signature': the expected signature has the wrong length / is not parseable.
 * - 'unsupported-format': expected signature is neither 64 hex chars nor 44-char base64.
 * - 'missing-secret': no secret was provided.
 *
 * @param {string} message
 * @param {string} expectedSignature
 * @param {string} secret
 * @param {'utf8'|'hex'} [keyEncoding='utf8']
 * @returns {Promise<'match' | 'mismatch' | 'invalid-signature' | 'unsupported-format' | 'missing-secret'>}
 */
async function verifyHmacSha256(message, expectedSignature, secret, keyEncoding = 'utf8') {
    if (!secret) return 'missing-secret';
    const expected = (expectedSignature || '').trim();
    if (!expected) return 'invalid-signature';

    let format;
    if (/^[0-9a-fA-F]{64}$/.test(expected)) {
        format = 'hex';
    } else if (/^[A-Za-z0-9+/]{43}=?$/.test(expected) && expected.length === 44) {
        format = 'base64';
    } else {
        return 'unsupported-format';
    }

    const computedBuffer = await hmacSha256OfString(message, secret, keyEncoding);
    const computed = format === 'hex'
        ? bufferToHex(computedBuffer)
        : bufferToBase64(computedBuffer);

    return constantTimeEqual(
        format === 'hex' ? expected.toLowerCase() : expected,
        computed
    ) ? 'match' : 'mismatch';
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        bufferToHex,
        bufferToBase64,
        hexToBytes,
        constantTimeEqual,
        decodeSecret,
        hmacSha256OfString,
        hmacSha256OfBuffer,
        verifyHmacSha256
    };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.bufferToHex = bufferToHex;
    window.bufferToBase64 = bufferToBase64;
    window.hexToBytes = hexToBytes;
    window.constantTimeEqual = constantTimeEqual;
    window.decodeSecret = decodeSecret;
    window.hmacSha256OfString = hmacSha256OfString;
    window.hmacSha256OfBuffer = hmacSha256OfBuffer;
    window.verifyHmacSha256 = verifyHmacSha256;
}

// --- DOM Glue ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // --- DOM Elements ---
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const inputText = document.getElementById('inputText');
        const verifyText = document.getElementById('verifyText');
        const verifyHash = document.getElementById('verifyHash');
        const secretKey = document.getElementById('secretKey');
        const outputEl = document.getElementById('output');
        const outputStatsEl = document.getElementById('outputStats');
        const validationMessageEl = document.getElementById('validationMessage');
        const validationTextEl = document.getElementById('validationText');
        const charCountEl = document.getElementById('charCount');
        const verifyCharCountEl = document.getElementById('verifyCharCount');
        const keyCharCountEl = document.getElementById('keyCharCount');
        const outputFormatWrap = document.getElementById('outputFormatWrap');

        // Buttons
        const copyBtn = document.getElementById('copyBtn');
        const clearBtn = document.getElementById('clearBtn');
        const verifyBtn = document.getElementById('verifyBtn');
        const toggleKeyBtn = document.getElementById('toggleKeyVisibility');
        const loadSampleKeyBtn = document.getElementById('loadSampleKeyBtn');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const loadVerifySampleBtn = document.getElementById('loadVerifySampleBtn');

        // Toggles / Tabs
        const textTabBtn = document.getElementById('text-tab');
        const fileTabBtn = document.getElementById('file-tab');
        const verifyTabBtn = document.getElementById('verify-tab');
        const formatHexRx = document.getElementById('formatHex');
        const formatHexUpperRx = document.getElementById('formatHexUpper');
        const formatBase64Rx = document.getElementById('formatBase64');
        const keyUtf8Rx = document.getElementById('keyUtf8');
        const keyHexRx = document.getElementById('keyHex');

        // History
        const history = new HistoryManager({
            getType: (item) => item.type || 'HMAC',
            getPreview: (item) => (item.preview || '').substring(0, 100)
        });

        // Constants
        const MAX_FILE_SIZE_MB = 5;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        const MAX_TEXT_CHARS = 5000;

        // --- State ---
        let currentMode = 'text'; // 'text' | 'file' | 'verify'
        let outputFormat = 'hex'; // 'hex' | 'hex-upper' | 'base64'
        let keyEncoding = 'utf8'; // 'utf8' | 'hex'
        let keyVisible = false;

        // --- Event Listeners ---

        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => {
                if (inputText.value.trim() !== '') {
                    const proceed = window.confirm('This will overwrite your current message. Do you want to continue?');
                    if (!proceed) return;
                }
                const textTab = new bootstrap.Tab(document.getElementById('text-tab'));
                textTab.show();
                secretKey.value = window.SampleData.hmacSha256.key;
                keyCharCountEl.textContent = `${secretKey.value.length} chars`;
                inputText.value = window.SampleData.hmacSha256.message;
                processText();
            });
        }

        if (loadSampleKeyBtn) {
            loadSampleKeyBtn.addEventListener('click', () => {
                if (secretKey.value.trim() !== '') {
                    const proceed = window.confirm('This will overwrite your current key. Do you want to continue?');
                    if (!proceed) return;
                }
                secretKey.value = window.SampleData.hmacSha256.key;
                keyCharCountEl.textContent = `${secretKey.value.length} chars`;
                keyUtf8Rx.checked = true;
                keyEncoding = 'utf8';
            });
        }

        if (loadVerifySampleBtn) {
            loadVerifySampleBtn.addEventListener('click', () => {
                if (verifyText.value.trim() !== '' || verifyHash.value.trim() !== '') {
                    const proceed = window.confirm('This will overwrite your current verify input. Do you want to continue?');
                    if (!proceed) return;
                }
                const vTab = new bootstrap.Tab(document.getElementById('verify-tab'));
                vTab.show();
                secretKey.value = window.SampleData.hmacSha256.key;
                keyCharCountEl.textContent = `${secretKey.value.length} chars`;
                verifyText.value = window.SampleData.hmacSha256.message;
                verifyHash.value = window.SampleData.hmacSha256Verify.expectedSignature;
                verifyCharCountEl.textContent = `${verifyText.value.length}/${MAX_TEXT_CHARS}`;
            });
        }

        // Tab Switching
        textTabBtn.addEventListener('shown.bs.tab', () => {
            currentMode = 'text';
            resetUI();
            outputFormatWrap.style.display = '';
            inputText.focus();
        });

        fileTabBtn.addEventListener('shown.bs.tab', () => {
            currentMode = 'file';
            resetUI();
            outputFormatWrap.style.display = '';
        });

        verifyTabBtn.addEventListener('shown.bs.tab', () => {
            currentMode = 'verify';
            resetUI();
            outputFormatWrap.style.display = 'none';
            verifyText.focus();
        });

        // Format toggle
        [formatHexRx, formatHexUpperRx, formatBase64Rx].forEach(rx => {
            rx.addEventListener('change', () => {
                if (rx.checked) {
                    outputFormat = rx.value;
                    if (currentMode === 'text') processText();
                }
            });
        });

        // Key encoding toggle
        keyUtf8Rx.addEventListener('change', () => { if (keyUtf8Rx.checked) keyEncoding = 'utf8'; });
        keyHexRx.addEventListener('change', () => { if (keyHexRx.checked) keyEncoding = 'hex'; });

        // Toggle key visibility
        toggleKeyBtn.addEventListener('click', () => {
            keyVisible = !keyVisible;
            secretKey.type = keyVisible ? 'text' : 'password';
            const icon = toggleKeyBtn.querySelector('i');
            const label = toggleKeyBtn.querySelector('span') || toggleKeyBtn;
            if (keyVisible) {
                icon.className = 'bi bi-eye-slash';
                toggleKeyBtn.lastChild.textContent = ' Hide';
            } else {
                icon.className = 'bi bi-eye';
                toggleKeyBtn.lastChild.textContent = ' Show';
            }
        });

        // File Input
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });

        // Drag & Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files[0]);
        });

        // Text Inputs
        inputText.addEventListener('input', processText);
        verifyText.addEventListener('input', () => {
            verifyCharCountEl.textContent = `${verifyText.value.length}/${MAX_TEXT_CHARS}`;
        });
        secretKey.addEventListener('input', () => {
            keyCharCountEl.textContent = `${secretKey.value.length} chars`;
            if (currentMode === 'text') processText();
        });

        // Verify
        verifyBtn.addEventListener('click', runVerify);

        // Copy & Clear
        copyBtn.addEventListener('click', () => {
            const content = outputEl.value;
            if (!content) return;
            if (currentMode === 'text' || currentMode === 'file') {
                history.add({
                    value: content,
                    preview: content.substring(0, 100),
                    type: currentMode === 'text' ? 'Text' : 'File'
                });
            }
            outputEl.select();
            copyToClipboard(content, 'Copied to clipboard!');
        });

        clearBtn.addEventListener('click', resetUI);

        // --- Core Logic ---

        function resetUI() {
            outputEl.value = '';
            fileInput.value = '';
            inputText.value = '';
            verifyText.value = '';
            verifyHash.value = '';
            outputStatsEl.textContent = 'No input';
            validationMessageEl.classList.add('d-none');
            outputStatsEl.classList.remove('text-success', 'text-danger', 'text-info');
            copyBtn.disabled = true;
            charCountEl.textContent = `0/${MAX_TEXT_CHARS}`;
            verifyCharCountEl.textContent = `0/${MAX_TEXT_CHARS}`;
            inputText.classList.remove('border-warning');
            verifyText.classList.remove('border-warning');
            verifyHash.classList.remove('border-warning', 'border-success', 'border-danger');
            secretKey.classList.remove('border-warning');
        }

        function showError(msg) {
            validationTextEl.textContent = msg;
            validationMessageEl.classList.remove('d-none');
            outputStatsEl.textContent = 'Error';
            copyBtn.disabled = true;
        }

        function showInfo(msg) {
            validationTextEl.textContent = msg;
            validationMessageEl.classList.remove('d-none');
        }

        function clearError() {
            validationMessageEl.classList.add('d-none');
            inputText.classList.remove('border-warning');
            verifyText.classList.remove('border-warning');
            verifyHash.classList.remove('border-warning');
            secretKey.classList.remove('border-warning');
        }

        function formatBuffer(buffer) {
            if (outputFormat === 'hex') return bufferToHex(buffer);
            if (outputFormat === 'hex-upper') return bufferToHex(buffer).toUpperCase();
            return bufferToBase64(buffer);
        }

        // File Processing
        async function handleFile(file) {
            clearError();
            outputEl.value = '';
            outputStatsEl.textContent = 'Processing...';
            outputStatsEl.classList.remove('text-success', 'text-danger', 'text-info');

            if (!file) return;

            if (file.size > MAX_FILE_SIZE_BYTES) {
                showError(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
                return;
            }

            if (!secretKey.value) {
                showError('Enter a secret key first.');
                secretKey.classList.add('border-warning');
                return;
            }

            try {
                const buffer = await file.arrayBuffer();
                const digest = await hmacSha256OfBuffer(buffer, secretKey.value, keyEncoding);
                const result = formatBuffer(digest);

                outputEl.value = result;
                const sizeStr = formatBytes(file.size);
                outputStatsEl.textContent = `${file.name} (${sizeStr})`;
                outputStatsEl.classList.add('text-success');
                copyBtn.disabled = false;
                history.add({
                    value: result,
                    preview: `${file.name}: ${result.substring(0, 100)}`,
                    type: 'File'
                });
            } catch (e) {
                console.error(e);
                if (keyEncoding === 'hex') {
                    showError('Hex key is invalid. Provide even-length hex (e.g. 0b0b0b0b...).');
                } else {
                    showError('Error reading or signing file.');
                }
            }
        }

        // Text Processing
        async function processText() {
            const text = inputText.value;
            const len = text.length;

            charCountEl.textContent = `${len}/${MAX_TEXT_CHARS}`;
            outputStatsEl.classList.remove('text-success', 'text-danger', 'text-info');

            if (len === 0) {
                outputEl.value = '';
                outputStatsEl.textContent = 'No input';
                clearError();
                copyBtn.disabled = true;
                return;
            }

            if (len > MAX_TEXT_CHARS) {
                showError(`Input exceeds ${MAX_TEXT_CHARS} characters.`);
                inputText.classList.add('border-warning');
                outputEl.value = '';
                copyBtn.disabled = true;
                return;
            }

            if (!secretKey.value) {
                outputEl.value = '';
                outputStatsEl.textContent = 'Need key';
                showError('Enter a shared secret key.');
                secretKey.classList.add('border-warning');
                copyBtn.disabled = true;
                return;
            }

            clearError();
            outputStatsEl.textContent = 'Signing...';

            try {
                const buffer = await hmacSha256OfString(text, secretKey.value, keyEncoding);
                const result = formatBuffer(buffer);
                outputEl.value = result;
                outputStatsEl.textContent = `Signed ${len} chars`;
                outputStatsEl.classList.add('text-success');
                copyBtn.disabled = false;
            } catch (e) {
                console.error(e);
                if (keyEncoding === 'hex') {
                    showError('Hex key is invalid. Provide even-length hex (e.g. 0b0b0b0b...).');
                } else {
                    showError('Signing error.');
                }
                copyBtn.disabled = true;
            }
        }

        // Verify
        async function runVerify() {
            const text = verifyText.value;
            const hash = verifyHash.value.trim();
            outputStatsEl.classList.remove('text-success', 'text-danger', 'text-info');
            verifyHash.classList.remove('border-success', 'border-danger', 'border-warning');

            if (!secretKey.value) {
                showError('Enter the shared secret key.');
                secretKey.classList.add('border-warning');
                return;
            }
            if (!text) {
                showError('Enter the original message.');
                verifyText.classList.add('border-warning');
                return;
            }
            if (!hash) {
                showError('Enter the expected HMAC signature.');
                verifyHash.classList.add('border-warning');
                return;
            }
            if (text.length > MAX_TEXT_CHARS) {
                showError(`Input exceeds ${MAX_TEXT_CHARS} characters.`);
                verifyText.classList.add('border-warning');
                return;
            }

            clearError();
            outputStatsEl.textContent = 'Verifying...';

            try {
                const status = await verifyHmacSha256(text, hash, secretKey.value, keyEncoding);
                const computedBuffer = await hmacSha256OfString(text, secretKey.value, keyEncoding);
                const computedHex = bufferToHex(computedBuffer);

                if (status === 'match') {
                    outputEl.value = computedHex;
                    outputStatsEl.textContent = 'Match';
                    outputStatsEl.classList.add('text-success');
                    verifyHash.classList.add('border-success');
                    showInfo('Match - the message produces the expected HMAC signature.');
                    copyBtn.disabled = false;
                } else if (status === 'mismatch') {
                    outputEl.value = computedHex;
                    outputStatsEl.textContent = 'Mismatch';
                    outputStatsEl.classList.add('text-danger');
                    verifyHash.classList.add('border-danger');
                    showError('Mismatch - the message does NOT produce the expected HMAC signature.');
                    copyBtn.disabled = false;
                } else if (status === 'unsupported-format') {
                    outputEl.value = '';
                    outputStatsEl.textContent = 'Invalid format';
                    showError('Expected signature must be 64 hex characters or a 44-char Base64 string.');
                    verifyHash.classList.add('border-warning');
                } else {
                    outputEl.value = '';
                    outputStatsEl.textContent = 'Invalid input';
                    showError('Invalid expected signature.');
                }
            } catch (e) {
                console.error(e);
                if (keyEncoding === 'hex') {
                    showError('Hex key is invalid. Provide even-length hex (e.g. 0b0b0b0b...).');
                } else {
                    showError('Verification error.');
                }
            }
        }

        // Helpers
        function formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
    });
}



function showToast(message = 'Copied to clipboard!') {
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

        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-2"></i> <span id="toastMessage"></span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
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
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex; justify-content: center; align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    const container = document.createElement('div');
    container.style.cssText = `
        background: white; border-radius: 12px; padding: 24px;
        max-width: 500px; width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = 'margin: 0 0 16px 0; color: #333; font-size: 14px; text-align: center;';
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
        width: 100%; min-height: 150px; padding: 12px;
        border: 1px solid #ddd; border-radius: 8px;
        font-family: monospace; font-size: 13px; resize: vertical;
        box-sizing: border-box; margin-bottom: 16px;
    `;
    textarea.readOnly = true;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        background: #0d6efd; color: white; border: none;
        padding: 10px 24px; border-radius: 6px; cursor: pointer;
        font-size: 14px; display: block; margin: 0 auto;
    `;
    const closeOverlay = () => {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
    };
    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
    const handleEscape = (e) => { if (e.key === 'Escape') closeOverlay(); };
    document.addEventListener('keydown', handleEscape);
    container.appendChild(instruction);
    container.appendChild(textarea);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    textarea.focus();
    textarea.select();
}

function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyTextToClipboard(text, successMessage);
    }
}