// --- Pure helpers (browser + Node testable) ---

/**
 * Locate the character offset of a JSON parse error.
 *
 * Supports two V8 message shapes:
 *   - "...at position N" (or "(line X column Y)"): direct offset.
 *   - `Unexpected token 'X', "src" is not valid JSON`: extract token X, then scan
 *     backwards from the end of the source for the last occurrence of X outside
 *     a string literal (best-effort heuristic; ~99% accurate for typical JSON
 *     errors because the offending token is usually a structural character).
 *   - `Unexpected end of JSON input`: returns text.length.
 *
 * @param {string} text
 * @param {string} errMessage
 * @returns {number|null} 0-based character offset, or null if unknown.
 */
function findErrorPosition(text, errMessage) {
    if (!errMessage) return null;

    const posMatch = errMessage.match(/at position (\d+)/);
    if (posMatch) return parseInt(posMatch[1], 10);

    if (/Unexpected end of JSON/i.test(errMessage)) {
        return text.length;
    }

    const tokenMatch = errMessage.match(/Unexpected token ['"]?(.)['"]?,/);
    if (tokenMatch && text) {
        const token = tokenMatch[1];
        // Scan backwards, tracking string state, looking for token outside a string.
        let inString = false;
        let escaped = false;
        for (let i = text.length - 1; i >= 0; i--) {
            const ch = text[i];
            if (escaped) { escaped = false; continue; }
            if (inString && ch === '\\') { escaped = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (!inString && ch === token) return i;
        }
        return text.lastIndexOf(token);
    }

    return null;
}

/**
 * Convert a 0-based character offset into 1-based line + column numbers.
 * @param {string} text
 * @param {number} position
 * @returns {{line: number, column: number}}
 */
function offsetToLineColumn(text, position) {
    const before = text.slice(0, position);
    const newlines = before.match(/\n/g);
    const line = (newlines ? newlines.length : 0) + 1;
    const lastNl = before.lastIndexOf('\n');
    const column = lastNl === -1 ? position + 1 : position - lastNl;
    return { line, column };
}

/**
 * Parse a JSON string and return rich error metadata (message + position + line + column)
 * when the input is not valid JSON.
 *
 * @param {string} text
 * @returns {{valid: true, value: any} | {valid: false, message: string, position: number|null, line: number|null, column: number|null}}
 */
function parseJsonWithMeta(text) {
    if (typeof text !== 'string') {
        return { valid: false, message: 'Input must be a string.', position: null, line: null, column: null };
    }
    if (text.trim().length === 0) {
        return { valid: false, message: 'Input is empty.', position: 0, line: 1, column: 1 };
    }
    try {
        const value = JSON.parse(text);
        return { valid: true, value };
    } catch (e) {
        const message = (e && e.message) ? String(e.message) : 'Invalid JSON.';
        const position = findErrorPosition(text, message);
        let line = null;
        let column = null;
        if (position !== null) {
            const lc = offsetToLineColumn(text, position);
            line = lc.line;
            column = lc.column;
        }
        return { valid: false, message, position, line, column };
    }
}

/**
 * Compute summary stats for a parsed JSON value.
 * @param {string} text - the JSON text (used for byte/line counts)
 * @param {*} value - the parsed value
 * @returns {{bytes: number, lines: number, topType: string, depth: number}}
 */
function jsonStats(text, value) {
    const bytes = new TextEncoder().encode(text).length;
    const lines = text.split('\n').length;
    let topType;
    if (value === null) topType = 'null';
    else if (Array.isArray(value)) topType = 'array';
    else topType = typeof value; // 'object' | 'string' | 'number' | 'boolean'

    let depth = 0;
    (function walk(v, d) {
        if (v === null || typeof v !== 'object') return;
        if (d > depth) depth = d;
        if (Array.isArray(v)) {
            for (let i = 0; i < v.length; i++) walk(v[i], d + 1);
        } else {
            for (const key of Object.keys(v)) walk(v[key], d + 1);
        }
    })(value, 1);

    return { bytes, lines, topType, depth };
}

/**
 * Pretty-print a JSON string with the given indent.
 * @param {string} text
 * @param {string} [indent='  '] - the literal indent string
 * @returns {{ok: true, output: string, stats: object} | {ok: false, error: {message: string, line: number|null, column: number|null, position: number|null}}}
 */
function formatJson(text, indent) {
    const indentStr = indent === undefined ? '  ' : indent;
    const parsed = parseJsonWithMeta(text);
    if (!parsed.valid) {
        return { ok: false, error: { message: parsed.message, line: parsed.line, column: parsed.column, position: parsed.position } };
    }
    const output = JSON.stringify(parsed.value, null, indentStr);
    return { ok: true, output, stats: jsonStats(output, parsed.value) };
}

/**
 * Minify a JSON string (strip all non-essential whitespace).
 * @param {string} text
 * @returns {{ok: true, output: string, stats: object} | {ok: false, error: object}}
 */
function minifyJson(text) {
    const parsed = parseJsonWithMeta(text);
    if (!parsed.valid) {
        return { ok: false, error: { message: parsed.message, line: parsed.line, column: parsed.column, position: parsed.position } };
    }
    const output = JSON.stringify(parsed.value);
    return { ok: true, output, stats: jsonStats(output, parsed.value) };
}

/**
 * Validate a JSON string without producing a transformed output.
 * @param {string} text
 * @returns {{ok: true, stats: object} | {ok: false, error: object}}
 */
function validateJson(text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
        return { ok: false, error: { message: 'Input is empty.', line: 1, column: 1, position: 0 } };
    }
    const parsed = parseJsonWithMeta(text);
    if (!parsed.valid) {
        return { ok: false, error: { message: parsed.message, line: parsed.line, column: parsed.column, position: parsed.position } };
    }
    return { ok: true, stats: jsonStats(text, parsed.value) };
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        findErrorPosition,
        offsetToLineColumn,
        parseJsonWithMeta,
        jsonStats,
        formatJson,
        minifyJson,
        validateJson
    };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.findErrorPosition = findErrorPosition;
    window.offsetToLineColumn = offsetToLineColumn;
    window.parseJsonWithMeta = parseJsonWithMeta;
    window.jsonStats = jsonStats;
    window.formatJson = formatJson;
    window.minifyJson = minifyJson;
    window.validateJson = validateJson;
}

// --- DOM Glue ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const inputEl = document.getElementById('inputJson');
        const outputEl = document.getElementById('outputJson');
        const formatBtn = document.getElementById('formatBtn');
        const minifyBtn = document.getElementById('minifyBtn');
        const validateBtn = document.getElementById('validateBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtn = document.getElementById('copyBtn');
        const indentSelect = document.getElementById('indentSelect');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const statusEl = document.getElementById('validationStatus');
        const statsEl = document.getElementById('outputStats');

        const history = new HistoryManager({
            getType: (item) => item.action || 'JSON',
            getPreview: (item) => item.preview || ''
        });

        const MAX_CHARS = 50000;

        function getIndent() {
            const v = indentSelect.value;
            if (v === '2') return '  ';
            if (v === '4') return '    ';
            return '\t';
        }

        function setStatus(kind, msg, meta) {
            statusEl.className = 'alert mb-3 ' + (
                kind === 'ok' ? 'alert-success' :
                kind === 'err' ? 'alert-danger' :
                'alert-secondary'
            );
            let html = '';
            if (kind === 'ok') html += '<i class="bi bi-check-circle-fill me-2"></i>';
            else if (kind === 'err') html += '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
            else html += '<i class="bi bi-info-circle me-2"></i>';
            html += '<span>' + escapeHtml(msg) + '</span>';
            if (meta && meta.line) {
                html += '<span class="ms-2 opacity-75">at line ' + meta.line + ', column ' + meta.column + '</span>';
            }
            statusEl.innerHTML = html;
            statusEl.classList.remove('d-none');
        }

        function setStats(stats) {
            if (!stats) {
                statsEl.textContent = '';
                return;
            }
            statsEl.textContent =
                stats.bytes + ' bytes · ' + stats.lines + ' lines · top-level ' + stats.topType + ' · depth ' + stats.depth;
        }

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function handleResult(res) {
            if (res.ok) {
                outputEl.value = res.output;
                setStatus('ok', 'Valid JSON');
                setStats(res.stats);
                copyBtn.disabled = false;

                const action = formatBtn.checked ? 'Format' : minifyBtn.checked ? 'Minify' : 'Validate';
                if (action !== 'Validate') {
                    history.add({
                        value: res.output,
                        action: action,
                        preview: (res.output || '').substring(0, 100)
                    });
                }
            } else {
                outputEl.value = '';
                setStatus('err', res.error.message, res.error);
                setStats(null);
                copyBtn.disabled = true;
            }
        }

        formatBtn.addEventListener('click', () => {
            const raw = inputEl.value;
            if (!raw.trim()) {
                setStatus('info', 'Paste some JSON first.');
                outputEl.value = '';
                setStats(null);
                copyBtn.disabled = true;
                return;
            }
            handleResult(formatJson(raw, getIndent()));
        });

        minifyBtn.addEventListener('click', () => {
            const raw = inputEl.value;
            if (!raw.trim()) {
                setStatus('info', 'Paste some JSON first.');
                outputEl.value = '';
                setStats(null);
                copyBtn.disabled = true;
                return;
            }
            handleResult(minifyJson(raw));
        });

        validateBtn.addEventListener('click', () => {
            const raw = inputEl.value;
            const res = validateJson(raw);
            if (res.ok) {
                setStatus('ok', 'Valid JSON');
                setStats(res.stats);
            } else {
                setStatus('err', res.error.message, res.error);
                setStats(null);
            }
        });

        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputEl.value = '';
            statusEl.classList.add('d-none');
            statsEl.textContent = '';
            copyBtn.disabled = true;
            inputEl.focus();
        });

        copyBtn.addEventListener('click', () => {
            if (!outputEl.value) return;
            outputEl.select();
            copyToClipboard(outputEl.value, 'JSON copied to clipboard!');
        });

        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm('This will overwrite your current input. Do you want to continue?');
                if (!proceed) return;
            }
            inputEl.value = window.SampleData.jsonFormatter;
            statusEl.classList.add('d-none');
            statsEl.textContent = '';
            outputEl.value = '';
            copyBtn.disabled = true;
            // Auto-format on load so the user immediately sees it work
            handleResult(formatJson(inputEl.value, getIndent()));
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
            '<div class="d-flex">' +
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