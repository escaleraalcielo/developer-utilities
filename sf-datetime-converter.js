// --- Pure helpers (browser + Node testable) ---

/**
 * A curated list of common IANA time zones shown by default in the picker.
 * Browsers also expose `Intl.supportedValuesOf('timeZone')` for the full list.
 */
const COMMON_TIMEZONES = [
    'UTC',
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Mexico_City',
    'America/Bogota',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Africa/Cairo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland'
];

/**
 * Parse a string into a Date. Supports ISO 8601 (with or without TZ), Salesforce-style
 * "YYYY-MM-DD HH:mm:ss", date-only "YYYY-MM-DD", and Unix epoch (seconds or milliseconds).
 *
 * @param {string} input
 * @returns {{
 *   ok: true,
 *   date: Date,
 *   original: string,
 *   unit?: 'seconds' | 'milliseconds',
 *   hadTimezone: boolean,
 *   assumedUtc?: boolean
 * } | {ok: false, error: string}}
 */
function parseDatetime(input) {
    if (typeof input !== 'string') {
        return { ok: false, error: 'Input must be a string.' };
    }
    const trimmed = input.trim();
    if (!trimmed) {
        return { ok: false, error: 'Input is empty.' };
    }

    // Unix epoch — pure digits (with optional decimal).
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const num = Number(trimmed);
        // Heuristic: if absolute value is below ~1e12, treat as seconds.
        // 1e12 seconds = year 33658 (so 13+ digit integers are ms).
        const isMs = Math.abs(num) >= 1e12;
        const date = new Date(isMs ? num : num * 1000);
        if (isNaN(date.getTime())) {
            return { ok: false, error: 'Invalid Unix epoch timestamp.' };
        }
        return {
            ok: true,
            date,
            original: trimmed,
            unit: isMs ? 'milliseconds' : 'seconds',
            hadTimezone: true
        };
    }

    // ISO 8601 with TZ (Z or +HH:MM offset).
    const isoTzRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+\-]\d{2}:?\d{2})$/;
    let m = trimmed.match(isoTzRegex);
    if (m) {
        // Validated the format — let Date.parse interpret the offset directly.
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return { ok: true, date, original: trimmed, hadTimezone: true };
        }
    }

    // Salesforce DateTime without explicit TZ (assumed UTC).
    const sfDtRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
    m = trimmed.match(sfDtRegex);
    if (m) {
        const [, y, mo, d, h, mi, s, frac] = m;
        const canonical = `${y}-${mo}-${d}T${h}:${mi}:${s || '00'}.${(frac || '0').padEnd(3, '0').slice(0, 3)}Z`;
        const date = new Date(canonical);
        if (!isNaN(date.getTime())) {
            return { ok: true, date, original: trimmed, hadTimezone: false, assumedUtc: true };
        }
    }

    // Date only: YYYY-MM-DD (assumed midnight UTC).
    const dateOnlyRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    m = trimmed.match(dateOnlyRegex);
    if (m) {
        const date = new Date(trimmed + 'T00:00:00Z');
        if (!isNaN(date.getTime())) {
            return { ok: true, date, original: trimmed, hadTimezone: false, assumedUtc: true };
        }
    }

    // Fallback: let Date.parse try.
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
        const hadTz = /[Zz]$|[+\-]\d{2}:?\d{2}$/.test(trimmed);
        return { ok: true, date: fallback, original: trimmed, hadTimezone: hadTz };
    }

    return {
        ok: false,
        error: 'Could not parse datetime. Use ISO 8601 (2024-01-15T10:30:00Z), Salesforce format (2024-01-15 10:30:00), Date (2024-01-15), or Unix epoch.'
    };
}

/**
 * Extract Y/M/D/H/M/S/ms parts of a Date as observed in a given IANA timezone.
 * @param {Date} date
 * @param {string} timeZone - IANA timezone name (e.g. 'UTC', 'America/Mexico_City')
 * @returns {{year: string, month: string, day: string, hour: string, minute: string, second: string, millisecond: string, weekday: string}}
 */
function getDatePartsInTimezone(date, timeZone) {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        fractionalSecondDigits: 3
    });
    const parts = {};
    for (const p of dtf.formatToParts(date)) {
        parts[p.type] = p.value;
    }
    // Some locales return hour '24' instead of '00' for midnight.
    if (parts.hour === '24') parts.hour = '00';
    // Some Node versions / browsers don't emit 'fractionalSecond' even when requested.
    if (!parts.fractionalSecond) parts.fractionalSecond = '000';
    return parts;
}

/**
 * Format a Date as Salesforce date string YYYY-MM-DD in the given timezone.
 * @param {Date} date
 * @param {string} timeZone
 * @returns {string}
 */
function formatSalesforceDate(date, timeZone) {
    const p = getDatePartsInTimezone(date, timeZone);
    return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Format a Date as Salesforce datetime string YYYY-MM-DDTHH:mm:ss.SSSZ (always UTC).
 * @param {Date} date
 * @returns {string}
 */
function formatSalesforceDateTimeUtc(date) {
    return date.toISOString();
}

/**
 * Format a Date as Salesforce datetime string in a given timezone,
 * but render it as if that timezone's wall time is UTC ("naive UTC").
 * Equivalent to: take the wall clock in `timeZone` and emit it as if it were UTC.
 *
 * This is the canonical Salesforce display format — SF stores datetime in UTC,
 * but when you query it from a non-UTC user context, you sometimes see the
 * wall-clock in your org's default TZ labeled as "Z".
 */
function formatSalesforceDateTimeAsUtc(date, timeZone) {
    const p = getDatePartsInTimezone(date, timeZone);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}.${p.fractionalSecond}Z`;
}

/**
 * Format a Date as a localized string in the given timezone.
 */
function formatLocalized(date, timeZone) {
    const dtf = new Intl.DateTimeFormat(undefined, {
        timeZone: timeZone || 'UTC',
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZoneName: 'short'
    });
    return dtf.format(date);
}

/**
 * Convert a parsed datetime into a bundle of useful formats.
 *
 * @param {string|number|Date} input
 * @param {{targetTimeZone?: string}} [options]
 */
function convertDatetime(input, options) {
    const opts = options || {};
    const targetTz = opts.targetTimeZone || 'UTC';

    let parsed;
    if (input instanceof Date) {
        parsed = { ok: true, date: input, original: '(Date object)', hadTimezone: true };
    } else {
        parsed = parseDatetime(input);
    }
    if (!parsed.ok) return parsed;

    const date = parsed.date;

    return {
        ok: true,
        input: String(input),
        parsed: {
            original: parsed.original,
            date,
            unit: parsed.unit,
            hadTimezone: parsed.hadTimezone,
            assumedUtc: parsed.assumedUtc || false
        },
        outputs: {
            salesforceDate: formatSalesforceDate(date, targetTz),
            salesforceDateTimeUtc: formatSalesforceDateTimeUtc(date),
            salesforceDateTimeAsTz: formatSalesforceDateTimeAsUtc(date, targetTz),
            iso8601: formatSalesforceDateTimeUtc(date),
            unixMs: date.getTime().toString(),
            unixSeconds: Math.floor(date.getTime() / 1000).toString(),
            localized: formatLocalized(date, targetTz)
        }
    };
}

/**
 * Convert a multi-line input of datetimes into per-line results.
 * @param {string} input
 * @param {{targetTimeZone?: string}} [options]
 */
function convertDatetimeBulk(input, options) {
    if (typeof input !== 'string') {
        return { ok: false, error: 'Input must be a string.' };
    }
    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
        return { ok: false, error: 'No input lines.' };
    }
    return {
        ok: true,
        results: lines.map(line => convertDatetime(line, options))
    };
}

/**
 * Detect the user's local timezone (IANA name).
 * @returns {string}
 */
function detectLocalTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {
        return 'UTC';
    }
}

/**
 * Current time formatted as Salesforce datetime UTC.
 */
function nowAsSalesforceUtc() {
    return new Date().toISOString();
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COMMON_TIMEZONES,
        parseDatetime,
        getDatePartsInTimezone,
        formatSalesforceDate,
        formatSalesforceDateTimeUtc,
        formatSalesforceDateTimeAsUtc,
        formatLocalized,
        convertDatetime,
        convertDatetimeBulk,
        detectLocalTimezone,
        nowAsSalesforceUtc
    };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.COMMON_TIMEZONES = COMMON_TIMEZONES;
    window.parseDatetime = parseDatetime;
    window.getDatePartsInTimezone = getDatePartsInTimezone;
    window.formatSalesforceDate = formatSalesforceDate;
    window.formatSalesforceDateTimeUtc = formatSalesforceDateTimeUtc;
    window.formatSalesforceDateTimeAsUtc = formatSalesforceDateTimeAsUtc;
    window.formatLocalized = formatLocalized;
    window.convertDatetime = convertDatetime;
    window.convertDatetimeBulk = convertDatetimeBulk;
    window.detectLocalTimezone = detectLocalTimezone;
    window.nowAsSalesforceUtc = nowAsSalesforceUtc;
}

// --- DOM Glue ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const inputEl = document.getElementById('inputDt');
        const outputSection = document.getElementById('outputSection');
        const singleOutput = document.getElementById('singleOutput');
        const bulkOutput = document.getElementById('bulkOutput');
        const bulkTableBody = document.getElementById('bulkTableBody');
        const bulkSummary = document.getElementById('bulkSummary');
        const tzSelect = document.getElementById('tzSelect');
        const nowBtn = document.getElementById('nowBtn');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const clearBtn = document.getElementById('clearBtn');
        const modeSingleBtn = document.getElementById('modeSingleBtn');
        const modeBulkBtn = document.getElementById('modeBulkBtn');
        const singlePane = document.getElementById('singlePane');
        const bulkPane = document.getElementById('bulkPane');

        // Populate timezone select with common TZs + detected local TZ if not already listed.
        const localTz = detectLocalTimezone();
        const tzSet = new Set(COMMON_TIMEZONES);
        if (!tzSet.has(localTz)) tzSet.add(localTz);

        const sortedTzs = Array.from(tzSet).sort((a, b) => {
            if (a === 'UTC') return -1;
            if (b === 'UTC') return 1;
            return a.localeCompare(b);
        });
        for (const tz of sortedTzs) {
            const opt = document.createElement('option');
            opt.value = tz;
            opt.textContent = tz + (tz === localTz ? '  (local)' : '');
            tzSelect.appendChild(opt);
        }
        tzSelect.value = localTz;

        let currentMode = 'single';

        function escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderSingleOutputs(res) {
            if (!res.ok) {
                singleOutput.innerHTML = '<div class="alert alert-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>' + escapeHtml(res.error) + '</div>';
                return;
            }

            const rows = [
                ['Salesforce Date', res.outputs.salesforceDate, 'YYYY-MM-DD'],
                ['Salesforce DateTime (UTC)', res.outputs.salesforceDateTimeUtc, 'YYYY-MM-DDTHH:mm:ss.sssZ'],
                ['SF DateTime (as ' + tzSelect.value + ')', res.outputs.salesforceDateTimeAsTz, 'TZ-naive, emitted as Z'],
                ['ISO 8601', res.outputs.iso8601, 'Always UTC'],
                ['Unix epoch (ms)', res.outputs.unixMs, '1705314600000'],
                ['Unix epoch (s)', res.outputs.unixSeconds, '1705314600'],
                ['Localized (' + tzSelect.value + ')', res.outputs.localized, 'Intl.DateTimeFormat']
            ];

            const meta = res.parsed.assumedUtc
                ? '<span class="badge bg-warning text-dark ms-2">assumed UTC</span>'
                : '';
            const unit = res.parsed.unit
                ? '<span class="badge bg-info bg-opacity-25 text-info ms-2">Unix ' + res.parsed.unit + '</span>'
                : '';

            let html = '<div class="mb-3">';
            html += '<div class="text-secondary small mb-2">Parsed <code>' + escapeHtml(res.parsed.original) + '</code>' + meta + unit + '</div>';
            html += '</div>';

            html += '<div class="list-group list-group-flush">';
            for (const [label, value, hint] of rows) {
                html += '<div class="list-group-item bg-transparent border-secondary border-opacity-10">';
                html += '<div class="d-flex justify-content-between align-items-start gap-3">';
                html += '<div class="flex-grow-1">';
                html += '<div class="text-secondary small text-uppercase fw-bold mb-1">' + escapeHtml(label) + '</div>';
                html += '<div class="font-monospace text-white text-break">' + escapeHtml(value) + '</div>';
                html += '<div class="text-secondary small mt-1">' + escapeHtml(hint) + '</div>';
                html += '</div>';
                html += '<button class="btn btn-sm btn-outline-light text-secondary border-0 copy-one" data-value="' + escapeHtml(value) + '" title="Copy">';
                html += '<i class="bi bi-clipboard"></i></button>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';

            singleOutput.innerHTML = html;

            // Wire up copy buttons
            singleOutput.querySelectorAll('.copy-one').forEach(btn => {
                btn.addEventListener('click', () => {
                    const v = btn.getAttribute('data-value');
                    copyToClipboard(v, 'Copied!');
                });
            });
        }

        function renderBulkOutputs(res) {
            if (!res.ok) {
                bulkTableBody.innerHTML = '';
                bulkSummary.innerHTML = '<div class="alert alert-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>' + escapeHtml(res.error) + '</div>';
                return;
            }
            bulkSummary.innerHTML = '<i class="bi bi-list-check me-2"></i>' +
                '<strong>' + res.results.length + '</strong> lines converted in timezone <strong>' + escapeHtml(tzSelect.value) + '</strong>';
            bulkTableBody.innerHTML = res.results.map(r => {
                if (!r.ok) {
                    return '<tr><td class="font-monospace text-break">' + escapeHtml(r.input) + '</td><td colspan="6" class="text-danger small">' + escapeHtml(r.error) + '</td></tr>';
                }
                return (
                    '<tr>' +
                    '<td class="font-monospace small text-break">' + escapeHtml(r.parsed.original) + '</td>' +
                    '<td class="font-monospace small">' + escapeHtml(r.outputs.salesforceDate) + '</td>' +
                    '<td class="font-monospace small">' + escapeHtml(r.outputs.salesforceDateTimeUtc) + '</td>' +
                    '<td class="font-monospace small">' + escapeHtml(r.outputs.unixMs) + '</td>' +
                    '<td class="font-monospace small">' + escapeHtml(r.outputs.localized) + '</td>' +
                    '</tr>'
                );
            }).join('');
        }

        function analyze() {
            const raw = inputEl.value;
            if (!raw.trim()) {
                outputSection.classList.add('d-none');
                return;
            }
            outputSection.classList.remove('d-none');

            if (currentMode === 'single') {
                const res = convertDatetime(raw, { targetTimeZone: tzSelect.value });
                renderSingleOutputs(res);
            } else {
                const res = convertDatetimeBulk(raw, { targetTimeZone: tzSelect.value });
                renderBulkOutputs(res);
            }
        }

        function setMode(mode) {
            currentMode = mode;
            if (mode === 'single') {
                modeSingleBtn.classList.add('active');
                modeBulkBtn.classList.remove('active');
                singlePane.classList.remove('d-none');
                bulkPane.classList.add('d-none');
            } else {
                modeBulkBtn.classList.add('active');
                modeSingleBtn.classList.remove('active');
                singlePane.classList.add('d-none');
                bulkPane.classList.remove('d-none');
            }
            analyze();
        }

        modeSingleBtn.addEventListener('click', () => setMode('single'));
        modeBulkBtn.addEventListener('click', () => setMode('bulk'));

        inputEl.addEventListener('input', analyze);
        tzSelect.addEventListener('change', analyze);

        nowBtn.addEventListener('click', () => {
            inputEl.value = nowAsSalesforceUtc();
            setMode('single');
            analyze();
        });

        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputSection.classList.add('d-none');
            inputEl.focus();
        });

        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm('This will overwrite your current input. Do you want to continue?');
                if (!proceed) return;
            }
            setMode('bulk');
            const samples = window.SampleData.sfDatetimeConverter;
            inputEl.value = samples.bulk.join('\n');
            analyze();
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