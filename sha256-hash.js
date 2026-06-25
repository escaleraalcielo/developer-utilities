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
    // Build binary string in chunks to avoid call-stack issues on large buffers
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
}

/**
 * Hash a UTF-8 string with SHA-256.
 * @param {string} text
 * @returns {Promise<ArrayBuffer>}
 */
async function sha256OfString(text) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API is not available in this environment.');
    }
    const bytes = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', bytes);
}

/**
 * Hash an ArrayBuffer / Uint8Array with SHA-256.
 * @param {ArrayBuffer | Uint8Array} data
 * @returns {Promise<ArrayBuffer>}
 */
async function sha256OfBuffer(data) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API is not available in this environment.');
    }
    return crypto.subtle.digest('SHA-256', data);
}

/**
 * Compare a known hash (hex or base64) to the SHA-256 of the given text.
 * Returns one of: 'match', 'mismatch', 'invalid-hash', 'unsupported-format'.
 *
 * - 'match': the expected hash equals the computed hash (in the same format).
 * - 'mismatch': both are valid but differ.
 * - 'invalid-hash': the expected hash is the wrong length / not parseable.
 * - 'unsupported-format': expected format is neither 64 hex chars nor valid base64.
 *
 * @param {string} text
 * @param {string} expectedHash
 * @returns {Promise<'match' | 'mismatch' | 'invalid-hash' | 'unsupported-format'>}
 */
async function verifySha256(text, expectedHash) {
    const expected = (expectedHash || '').trim();
    if (!expected) return 'invalid-hash';

    let format;
    if (/^[0-9a-fA-F]{64}$/.test(expected)) {
        format = 'hex';
    } else if (/^[A-Za-z0-9+/]{43}=?$/.test(expected) && expected.length === 44) {
        format = 'base64';
    } else {
        return 'unsupported-format';
    }

    const computedBuffer = await sha256OfString(text);

    let computed;
    if (format === 'hex') {
        computed = bufferToHex(computedBuffer);
        return expected.toLowerCase() === computed ? 'match' : 'mismatch';
    } else {
        computed = bufferToBase64(computedBuffer);
        return expected === computed ? 'match' : 'mismatch';
    }
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        bufferToHex,
        bufferToBase64,
        sha256OfString,
        sha256OfBuffer,
        verifySha256
    };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.bufferToHex = bufferToHex;
    window.bufferToBase64 = bufferToBase64;
    window.sha256OfString = sha256OfString;
    window.sha256OfBuffer = sha256OfBuffer;
    window.verifySha256 = verifySha256;
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
        const outputEl = document.getElementById('output');
        const outputStatsEl = document.getElementById('outputStats');
        const validationMessageEl = document.getElementById('validationMessage');
        const validationTextEl = document.getElementById('validationText');
        const charCountEl = document.getElementById('charCount');
        const verifyCharCountEl = document.getElementById('verifyCharCount');
        const outputFormatWrap = document.getElementById('outputFormatWrap');

        // Buttons
        const copyBtn = document.getElementById('copyBtn');
        const clearBtn = document.getElementById('clearBtn');
        const verifyBtn = document.getElementById('verifyBtn');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const loadVerifySampleBtn = document.getElementById('loadVerifySampleBtn');

        // Toggles / Tabs
        const textTabBtn = document.getElementById('text-tab');
        const fileTabBtn = document.getElementById('file-tab');
        const verifyTabBtn = document.getElementById('verify-tab');
        const formatHexRx = document.getElementById('formatHex');
        const formatHexUpperRx = document.getElementById('formatHexUpper');
        const formatBase64Rx = document.getElementById('formatBase64');

        // History
        const historyTableBody = document.getElementById('historyTableBody');
        const historyCountEl = document.getElementById('historyCount');
        let sessionHistory = [];
        const HISTORY_LIMIT = 10;

        // Constants
        const MAX_FILE_SIZE_MB = 5;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        const MAX_TEXT_CHARS = 5000;

        // --- State ---
        let currentMode = 'text'; // 'text' | 'file' | 'verify'
        let outputFormat = 'hex'; // 'hex' | 'hex-upper' | 'base64'

        // --- Event Listeners ---

        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => {
                if (inputText.value.trim() !== '') {
                    const proceed = window.confirm('This will overwrite your current input. Do you want to continue?');
                    if (!proceed) return;
                }
                const textTab = new bootstrap.Tab(document.getElementById('text-tab'));
                textTab.show();
                inputText.value = window.SampleData.sha256Hash;
                processText();
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
                verifyText.value = window.SampleData.sha256Verify.text;
                verifyHash.value = window.SampleData.sha256Verify.expectedHash;
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

        // Text Input
        inputText.addEventListener('input', processText);
        verifyText.addEventListener('input', () => {
            verifyCharCountEl.textContent = `${verifyText.value.length}/${MAX_TEXT_CHARS}`;
        });

        // Verify
        verifyBtn.addEventListener('click', runVerify);

        // Copy & Clear
        copyBtn.addEventListener('click', () => {
            const content = outputEl.value;
            if (!content) return;
            if (currentMode === 'text' || currentMode === 'file') {
                const label = currentMode === 'text' ? 'Hashed Text' : 'Hashed File';
                addToHistory(currentMode === 'text' ? 'Text' : 'File', label, content);
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

            if (typeof crypto === 'undefined' || !crypto.subtle) {
                showError('Web Crypto API is not available in this context. Try opening this page over HTTPS or localhost.');
                return;
            }

            try {
                const buffer = await file.arrayBuffer();
                const digest = await sha256OfBuffer(buffer);
                const result = formatBuffer(digest);

                outputEl.value = result;
                const sizeStr = formatBytes(file.size);
                outputStatsEl.textContent = `${file.name} (${sizeStr})`;
                outputStatsEl.classList.add('text-success');
                copyBtn.disabled = false;
                addToHistory('File', file.name, result);
            } catch (e) {
                console.error(e);
                showError('Error reading or hashing file.');
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

            if (typeof crypto === 'undefined' || !crypto.subtle) {
                showError('Web Crypto API is not available in this context. Try opening this page over HTTPS or localhost.');
                return;
            }

            clearError();
            outputStatsEl.textContent = 'Hashing...';

            try {
                const buffer = await sha256OfString(text);
                const result = formatBuffer(buffer);
                outputEl.value = result;
                outputStatsEl.textContent = `Hashed ${len} chars`;
                outputStatsEl.classList.add('text-success');
                copyBtn.disabled = false;
            } catch (e) {
                console.error(e);
                showError('Hashing error.');
            }
        }

        // Verify
        async function runVerify() {
            const text = verifyText.value;
            const hash = verifyHash.value.trim();
            outputStatsEl.classList.remove('text-success', 'text-danger', 'text-info');
            verifyHash.classList.remove('border-success', 'border-danger', 'border-warning');

            if (!text) {
                showError('Enter text to verify.');
                verifyText.classList.add('border-warning');
                return;
            }
            if (!hash) {
                showError('Enter the expected hash.');
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
                const status = await verifySha256(text, hash);
                const computed = await sha256OfString(text);
                const computedHex = bufferToHex(computed);

                if (status === 'match') {
                    outputEl.value = computedHex;
                    outputStatsEl.textContent = 'Match';
                    outputStatsEl.classList.add('text-success');
                    verifyHash.classList.add('border-success');
                    showInfo('Match - the text produces the expected hash.');
                    copyBtn.disabled = false;
                } else if (status === 'mismatch') {
                    outputEl.value = computedHex;
                    outputStatsEl.textContent = 'Mismatch';
                    outputStatsEl.classList.add('text-danger');
                    verifyHash.classList.add('border-danger');
                    showError('Mismatch - the text does NOT produce the expected hash.');
                    copyBtn.disabled = false;
                } else if (status === 'unsupported-format') {
                    outputEl.value = '';
                    outputStatsEl.textContent = 'Invalid format';
                    showError('Expected hash must be 64 hex characters or a SHA256 Base64 string (44 chars).');
                    verifyHash.classList.add('border-warning');
                } else {
                    outputEl.value = '';
                    outputStatsEl.textContent = 'Invalid input';
                    showError('Invalid expected hash.');
                }
            } catch (e) {
                console.error(e);
                showError('Verification error.');
            }
        }

        // --- History Logic ---

        window.copyFromHistory = (id) => {
            const item = sessionHistory.find(i => i.id === id);
            if (item) copyToClipboard(item.fullResult, 'Copied from history!');
        };

        window.deleteFromHistory = (id) => {
            sessionHistory = sessionHistory.filter(i => i.id !== id);
            renderHistory();
        };

        function addToHistory(type, label, content) {
            if (sessionHistory.length > 0 && sessionHistory[0].fullResult === content) return;

            const timestamp = new Date().toLocaleTimeString();
            const preview = content.substring(0, 60) + (content.length > 60 ? '...' : '');

            const newItem = {
                id: Date.now(),
                timestamp,
                type,
                label,
                preview,
                fullResult: content
            };

            sessionHistory.unshift(newItem);
            if (sessionHistory.length > HISTORY_LIMIT) sessionHistory.pop();
            renderHistory();
        }

        function renderHistory() {
            historyCountEl.textContent = `${sessionHistory.length}/${HISTORY_LIMIT}`;

            if (sessionHistory.length === 0) {
                historyTableBody.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4" class="py-4 text-secondary opacity-50 fst-italic">No saved results in this session.</td>
                    </tr>`;
                return;
            }

            historyTableBody.innerHTML = '';
            sessionHistory.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="align-middle text-secondary">${item.timestamp}</td>
                    <td class="align-middle text-info"><small>${item.type}</small></td>
                    <td class="align-middle text-break hash-output" style="font-size: 0.85em;">
                        ${escapeHtml(item.preview)}
                    </td>
                    <td class="align-middle text-end">
                        <button class="btn btn-sm btn-link text-primary p-0 me-2" onclick="copyFromHistory(${item.id})" title="Copy">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteFromHistory(${item.id})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                historyTableBody.appendChild(row);
            });
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

        function escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
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