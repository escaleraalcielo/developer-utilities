// --- Pure helpers (browser + Node testable) ---

/**
 * SOQL keywords that force a new line in the formatted output.
 * Order matters — multi-word keywords come first so the tokenizer
 * matches them before splitting into individual tokens.
 */
const LINE_BREAK_KEYWORDS = new Set([
    'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
    'FOR UPDATE', 'ALL ROWS', 'WITH SECURITY_ENFORCED', 'WITH'
]);

/**
 * SOQL single-word keywords to uppercase. Operators and punctuation
 * are preserved as-is.
 */
const SINGLE_WORD_KEYWORDS = new Set([
    'SELECT', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ASC', 'DESC', 'NULL',
    'TRUE', 'FALSE', 'AS', 'INCLUDES', 'EXCLUDES', 'TYPEOF', 'WHEN', 'THEN',
    'ELSE', 'END', 'USING', 'SCOPE', 'SECURITY_ENFORCED'
]);

/**
 * Map from a leading keyword to its multi-word keyword form (for the
 * tokenizer's lookahead).
 */
const MULTI_WORD_LOOKAHEAD = {
    'ORDER': 'BY',
    'GROUP': 'BY',
    'FOR': 'UPDATE',
    'ALL': 'ROWS',
    'USING': 'SCOPE'
};

/**
 * Tokenize a SOQL query into a stream of typed tokens.
 * Recognizes: string literals (with '' escapes), punctuation, operators,
 * single-word keywords, and multi-word keywords via lookahead.
 *
 * @param {string} query
 * @returns {Array<{type: 'word'|'string'|'punct'|'op', value: string}>}
 */
function tokenizeSoql(query) {
    const tokens = [];
    let i = 0;

    while (i < query.length) {
        const ch = query[i];

        // Whitespace
        if (/\s/.test(ch)) { i++; continue; }

        // String literal — single-quoted with '' escape.
        if (ch === "'") {
            let s = "'";
            i++;
            while (i < query.length) {
                s += query[i];
                if (query[i] === "'") {
                    if (i + 1 < query.length && query[i + 1] === "'") {
                        s += "'";
                        i += 2;
                    } else {
                        i++;
                        break;
                    }
                } else {
                    i++;
                }
            }
            tokens.push({ type: 'string', value: s });
            continue;
        }

        // Single-char punctuation
        if (ch === '(' || ch === ')' || ch === ',') {
            tokens.push({ type: 'punct', value: ch });
            i++;
            continue;
        }

        // Operators: !=, <>, <=, >=, =, <, >
        if (ch === '!' || ch === '<' || ch === '>' || ch === '=') {
            let op = ch;
            i++;
            if (i < query.length && query[i] === '=') { op += '='; i++; }
            else if (ch === '<' && i < query.length && query[i] === '>') { op += '>'; i++; }
            tokens.push({ type: 'op', value: op });
            continue;
        }

        // Word — read until whitespace, punctuation, operators, or quote.
        let word = '';
        while (i < query.length && !/[\s(),<>=!]/.test(query[i]) && query[i] !== "'") {
            word += query[i];
            i++;
        }

        // Multi-word keyword lookahead.
        const upper = word.toUpperCase();
        if (MULTI_WORD_LOOKAHEAD[upper]) {
            const nextExpected = MULTI_WORD_LOOKAHEAD[upper];
            // Skip whitespace
            let ni = i;
            while (ni < query.length && /\s/.test(query[ni])) ni++;
            // Read next word
            let nextWord = '';
            while (ni < query.length && !/[\s(),<>=!]/.test(query[ni]) && query[ni] !== "'") {
                nextWord += query[ni];
                ni++;
            }
            if (nextWord.toUpperCase() === nextExpected) {
                word = word + ' ' + nextWord;
                i = ni;
            }
        }

        tokens.push({ type: 'word', value: word });
    }

    return tokens;
}

/**
 * Validate a SOQL query for basic structural correctness.
 * Checks: SELECT/FROM presence, balanced parens, balanced single quotes.
 *
 * @param {string} query
 * @returns {{ok: true} | {ok: false, error: string, line: number|null, column: number|null}}
 */
function validateSoql(query) {
    if (typeof query !== 'string') {
        return { ok: false, error: 'Query must be a string.', line: null, column: null };
    }
    const trimmed = query.trim();
    if (!trimmed) {
        return { ok: false, error: 'Query is empty.', line: 1, column: 1 };
    }

    let inString = false;
    let parens = 0;
    let parenLine = 1;
    let parenCol = 1;
    let currentLine = 1;
    let currentCol = 1;

    for (let i = 0; i < query.length; i++) {
        const ch = query[i];
        if (ch === '\n') { currentLine++; currentCol = 1; continue; }

        if (ch === "'" && !inString) {
            inString = true;
        } else if (ch === "'" && inString) {
            if (i + 1 < query.length && query[i + 1] === "'") {
                i++; // escaped quote
                currentCol++;
            } else {
                inString = false;
            }
        } else if (!inString) {
            if (ch === '(') {
                parens++;
                parenLine = currentLine;
                parenCol = currentCol;
            } else if (ch === ')') {
                parens--;
                if (parens < 0) {
                    return { ok: false, error: 'Unbalanced closing parenthesis at line ' + currentLine + ', column ' + currentCol, line: currentLine, column: currentCol };
                }
            }
        }
        currentCol++;
    }

    if (inString) {
        return { ok: false, error: 'Unterminated string literal.', line: parenLine, column: parenCol };
    }
    if (parens !== 0) {
        return { ok: false, error: 'Unbalanced parentheses: ' + parens + ' unmatched opening paren(s).', line: parenLine, column: parenCol };
    }

    // Strip strings before keyword scan (don't trip on keywords inside string literals).
    const stripped = query.replace(/'(?:''|[^'])*'/g, '');
    if (!/^\s*SELECT\b/i.test(stripped)) {
        return { ok: false, error: 'Missing SELECT clause.', line: 1, column: 1 };
    }
    if (!/\bFROM\b/i.test(stripped)) {
        return { ok: false, error: 'Missing FROM clause.', line: 1, column: 1 };
    }

    return { ok: true };
}

/**
 * Emit formatted SOQL from a token stream.
 * @param {Array} tokens
 * @param {string} indent
 * @returns {string}
 */
function emitFormatted(tokens, indent) {
    let out = '';
    let parenDepth = 0;
    let atLineStart = false;
    let inSelectList = false;

    function lineIndent(level) { return indent.repeat(Math.max(0, level)); }
    function isLineBreakKeyword(u) { return LINE_BREAK_KEYWORDS.has(u); }
    function isKeyword(u) { return SINGLE_WORD_KEYWORDS.has(u) || LINE_BREAK_KEYWORDS.has(u); }

    function breakLine() {
        // SELECT-list fields get one extra indent level so they sit under SELECT.
        const depth = parenDepth + (inSelectList ? 1 : 0);
        out += '\n' + lineIndent(depth);
        atLineStart = true;
    }

    function space() {
        if (!atLineStart) out += ' ';
    }

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        const value = tok.value;

        if (tok.type === 'word') {
            const upper = value.toUpperCase();

            if (upper === 'SELECT') {
                out += 'SELECT';
                atLineStart = false;
                inSelectList = true;
                continue;
            }

            if (isLineBreakKeyword(upper)) {
                // Exiting SELECT list before breaking so FROM/WHERE/... indent correctly.
                inSelectList = false;
                breakLine();
                out += upper;
                atLineStart = false;
                continue;
            }

            if (inSelectList && !atLineStart) {
                // First field after SELECT, or first field after a comma + newline that
                // we've consumed: always break so each field is on its own line.
                breakLine();
            } else if (!inSelectList) {
                space();
            }
            out += isKeyword(upper) ? upper : value;
            atLineStart = false;
        } else if (tok.type === 'string') {
            space();
            out += value;
            atLineStart = false;
        } else if (tok.type === 'punct') {
            if (tok.value === '(') {
                space();
                out += '(';
                parenDepth++;
                atLineStart = false;
            } else if (tok.value === ')') {
                parenDepth--;
                out += ')';
                atLineStart = false;
            } else if (tok.value === ',') {
                out += ',';
                breakLine();
            }
        } else if (tok.type === 'op') {
            space();
            out += value;
            atLineStart = false;
        }
    }

    return out.replace(/\n\s*\n+/g, '\n').trim();
}

/**
 * Format a SOQL query for readability.
 *
 * @param {string} query
 * @param {string} [indent='  ']
 * @returns {{ok: true, output: string} | {ok: false, error: string, line: number|null, column: number|null}}
 */
function formatSoql(query, indent) {
    const indentStr = indent === undefined ? '  ' : indent;
    const v = validateSoql(query);
    if (!v.ok) return { ok: false, error: v.error, line: v.line, column: v.column };
    const tokens = tokenizeSoql(query);
    const output = emitFormatted(tokens, indentStr);
    return { ok: true, output };
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenizeSoql, validateSoql, formatSoql, emitFormatted };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.tokenizeSoql = tokenizeSoql;
    window.validateSoql = validateSoql;
    window.formatSoql = formatSoql;
    window.emitFormatted = emitFormatted;
}

// --- DOM Glue ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const inputEl = document.getElementById('inputSoql');
        const outputEl = document.getElementById('outputSoql');
        const formatBtn = document.getElementById('formatBtn');
        const validateBtn = document.getElementById('validateBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtn = document.getElementById('copyBtn');
        const indentSelect = document.getElementById('indentSelect');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const statusEl = document.getElementById('validationStatus');
        const statsEl = document.getElementById('outputStats');

        const history = new HistoryManager({
            getType: () => 'SOQL',
            getPreview: (item) => (item.preview || '').substring(0, 100)
        });

        function getIndent() {
            const v = indentSelect.value;
            if (v === '2') return '  ';
            if (v === '4') return '    ';
            return '\t';
        }

        function escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
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

        function setStats(text) {
            if (!text) { statsEl.textContent = ''; return; }
            const bytes = new TextEncoder().encode(text).length;
            const lines = text.split('\n').length;
            statsEl.textContent = bytes + ' bytes · ' + lines + ' lines';
        }

        formatBtn.addEventListener('click', () => {
            const raw = inputEl.value;
            if (!raw.trim()) {
                setStatus('info', 'Paste a SOQL query first.');
                outputEl.value = '';
                setStats(null);
                copyBtn.disabled = true;
                return;
            }
            const r = formatSoql(raw, getIndent());
            if (r.ok) {
                outputEl.value = r.output;
                setStatus('ok', 'Valid SOQL');
                setStats(r.output);
                copyBtn.disabled = false;

                history.add({
                    value: r.output,
                    preview: r.output.substring(0, 100)
                });
            } else {
                outputEl.value = '';
                setStatus('err', r.error, { line: r.line, column: r.column });
                setStats(null);
                copyBtn.disabled = true;
            }
        });

        validateBtn.addEventListener('click', () => {
            const raw = inputEl.value;
            const v = validateSoql(raw);
            if (v.ok) {
                setStatus('ok', 'Valid SOQL');
            } else {
                setStatus('err', v.error, { line: v.line, column: v.column });
            }
        });

        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputEl.value = '';
            statusEl.classList.add('d-none');
            setStats(null);
            copyBtn.disabled = true;
            inputEl.focus();
        });

        copyBtn.addEventListener('click', () => {
            if (!outputEl.value) return;
            outputEl.select();
            copyToClipboard(outputEl.value, 'SOQL copied to clipboard!');
        });

        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm('This will overwrite your current input. Do you want to continue?');
                if (!proceed) return;
            }
            inputEl.value = window.SampleData.soqlFormatter;
            formatBtn.click();
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