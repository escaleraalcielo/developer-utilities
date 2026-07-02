// --- Pure helpers (browser + Node testable) ---

/**
 * Standard Salesforce 3-char ID prefixes mapped to their default SObject name.
 * Covers the most common standard objects. Per-org custom object prefixes
 * (typically starting with 'a' or 'e') and uncommon system prefixes are not
 * included — those are detected heuristically as "Custom Object".
 */
const STANDARD_PREFIXES = {
    '001': 'Account',
    '002': 'Note',
    '003': 'Contact',
    '005': 'User',
    '006': 'Opportunity (legacy)',
    '008': 'Opportunity',
    '00B': 'List View',
    '00D': 'Organization',
    '00E': 'User Role',
    '00G': 'Group',
    '00I': 'Partner',
    '00J': 'Partner Role',
    '00K': 'Profile',
    '00M': 'Layout',
    '00O': 'Record Type',
    '00P': 'Sharing Rule',
    '00Q': 'Lead',
    '00R': 'Queue',
    '00S': 'Custom SObject',
    '00T': 'Territory',
    '00U': 'Apex Class',
    '00V': 'Apex Trigger',
    '00W': 'Email Template',
    '00X': 'Workflow Rule',
    '00Y': 'Validation Rule',
    '00Z': 'Apex Page',
    '010': 'Email Service',
    '011': 'Dashboard',
    '012': 'Report',
    '013': 'Document',
    '014': 'Folder',
    '015': 'Email Message',
    '016': 'Campaign',
    '017': 'Solution',
    '018': 'Idea',
    '01A': 'Event',
    '01B': 'Task',
    '01I': 'Pricebook',
    '01J': 'Product',
    '01K': 'Pricebook Entry',
    '01M': 'Asset',
    '01N': 'Contract',
    '01O': 'Order',
    '01P': 'Order Product',
    '01Q': 'Quote',
    '01R': 'Quote Line Item',
    '01T': 'Opportunity Line Item',
    '020': 'Flow / Process Definition',
    '021': 'Flow Interview',
    '02A': 'Content Document',
    '02B': 'Content Version',
    '02C': 'Content Link',
    '02D': 'Content Workspace',
    '030': 'Service Appointment',
    '031': 'Service Resource',
    '032': 'Service Territory',
    '033': 'Assigned Resource',
    '040': 'Work Type',
    '041': 'Work Order',
    '042': 'Work Order Line Item',
    '043': 'Work Plan',
    '044': 'Work Step',
    '045': 'Shift',
    '050': 'Macro',
    '0PS': 'Permission Set',
    '0PR': 'Permission Set Assignment',
    '0PA': 'Permission Set Group',
    '0PC': 'Permission Set License',
    '0Pf': 'Permission Set License Assignment',
    '0Pg': 'Permission Set Group Component',
    '500': 'Case'
};

/**
 * Heuristic ranges that are typically per-org custom objects.
 * Salesforce uses 'a' and 'e' prefixes for custom objects created in Setup.
 */
const CUSTOM_OBJECT_HEURISTIC_PREFIXES = /^[aA][0-9A-Z]{2}$|^[eE][0-9A-Z]{2}$/;

/**
 * Decode a single Salesforce ID.
 * @param {string} id
 * @returns {{
 *   ok: true,
 *   id: string,
 *   length: 15|18,
 *   prefix: string,
 *   objectName: string,
 *   isStandard: boolean,
 *   isCustom: boolean,
 *   isUnknown: boolean,
 *   isCaseSafe: boolean
 * } | {ok: false, error: string}}
 */
function decodeSobjectId(id) {
    if (typeof id !== 'string') {
        return { ok: false, error: 'ID must be a string.' };
    }
    const trimmed = id.trim();
    if (!trimmed) {
        return { ok: false, error: 'ID is empty.' };
    }
    if (!/^[a-zA-Z0-9]{15}$/.test(trimmed) && !/^[a-zA-Z0-9]{18}$/.test(trimmed)) {
        return { ok: false, error: 'Not a valid Salesforce ID (must be 15 or 18 alphanumeric characters).' };
    }

    const upper = trimmed.toUpperCase();
    const prefix = upper.substr(0, 3);
    const length = trimmed.length;

    let objectName = STANDARD_PREFIXES[prefix];
    let isCustom = false;
    let isUnknown = false;

    if (objectName === 'Custom SObject') {
        // Map our generic placeholder to a clearer label for non-standard '00S' object
        isCustom = true;
    } else if (!objectName) {
        if (CUSTOM_OBJECT_HEURISTIC_PREFIXES.test(prefix)) {
            objectName = 'Custom SObject';
            isCustom = true;
        } else {
            objectName = 'Unknown SObject';
            isUnknown = true;
        }
    }

    return {
        ok: true,
        id: trimmed,
        length,
        prefix,
        objectName,
        isStandard: !isCustom && !isUnknown,
        isCustom,
        isUnknown,
        isCaseSafe: length === 18
    };
}

/**
 * Decode a multi-line / comma-separated string of IDs into one result per token.
 * Whitespace, commas, semicolons, and newlines are valid separators.
 * @param {string} input
 * @returns {Array<{ok: true, ...} | {ok: false, error: string, raw: string}>}
 */
function decodeSobjectIds(input) {
    if (typeof input !== 'string') {
        return [{ ok: false, error: 'Input must be a string.', raw: String(input) }];
    }
    const tokens = input.split(/[\s,;]+/).filter(t => t.length > 0);
    if (tokens.length === 0) {
        return [];
    }
    return tokens.map(token => {
        const r = decodeSobjectId(token);
        if (!r.ok) r.raw = token;
        return r;
    });
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STANDARD_PREFIXES, decodeSobjectId, decodeSobjectIds };
}

// Expose to window for browser
if (typeof window !== 'undefined') {
    window.STANDARD_PREFIXES = STANDARD_PREFIXES;
    window.decodeSobjectId = decodeSobjectId;
    window.decodeSobjectIds = decodeSobjectIds;
}

// --- DOM Glue ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const inputEl = document.getElementById('inputIds');
        const outputTableBody = document.getElementById('outputTableBody');
        const summaryEl = document.getElementById('outputSummary');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtn = document.getElementById('copyBtn');
        const outputSection = document.getElementById('outputSection');

        const history = new HistoryManager({
            getType: () => 'SObject ID',
            getPreview: (item) => (item.preview || '').substring(0, 100)
        });

        function escapeHtml(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function classifyBadge(row) {
            if (!row.ok) return { cls: 'bg-danger', label: 'Invalid' };
            if (row.isStandard) return { cls: 'bg-success', label: 'Standard' };
            if (row.isCustom) return { cls: 'bg-info', label: 'Custom' };
            return { cls: 'bg-warning text-dark', label: 'Unknown' };
        }

        function renderResults(results) {
            if (results.length === 0) {
                outputSection.classList.add('d-none');
                return;
            }
            outputSection.classList.remove('d-none');

            const okCount = results.filter(r => r.ok).length;
            const errCount = results.length - okCount;
            summaryEl.innerHTML =
                '<i class="bi bi-list-check me-2"></i>' +
                '<strong>' + results.length + '</strong> IDs decoded &mdash; ' +
                '<span class="text-success">' + okCount + ' valid</span>' +
                (errCount > 0 ? ', <span class="text-danger">' + errCount + ' invalid</span>' : '');

            outputTableBody.innerHTML = results.map(row => {
                const badge = classifyBadge(row);
                if (!row.ok) {
                    return (
                        '<tr>' +
                        '<td class="font-monospace text-break">' + escapeHtml(row.raw) + '</td>' +
                        '<td><span class="badge ' + badge.cls + '">' + badge.label + '</span></td>' +
                        '<td colspan="3" class="text-danger small">' + escapeHtml(row.error) + '</td>' +
                        '</tr>'
                    );
                }
                return (
                    '<tr>' +
                    '<td class="font-monospace text-break">' + escapeHtml(row.id) + '</td>' +
                    '<td><span class="badge ' + badge.cls + '">' + badge.label + '</span></td>' +
                    '<td class="font-monospace text-info">' + escapeHtml(row.prefix) + '</td>' +
                    '<td class="text-white">' + escapeHtml(row.objectName) + '</td>' +
                    '<td class="text-secondary small">' + row.length + ' chars' + (row.isCaseSafe ? ' (case-safe)' : ' (case-sensitive)') + '</td>' +
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
            const results = decodeSobjectIds(raw);
            renderResults(results);
        }

        inputEl.addEventListener('input', analyze);

        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputSection.classList.add('d-none');
            inputEl.focus();
        });

        copyBtn.addEventListener('click', () => {
            const results = decodeSobjectIds(inputEl.value);
            const text = results.map(r => {
                if (!r.ok) return r.raw + '\tERROR\t' + r.error;
                return r.id + '\t' + r.prefix + '\t' + r.objectName;
            }).join('\n');
            if (text) {
                copyToClipboard(text, 'Results copied!');
                history.add({ value: text, preview: text.substring(0, 100) });
            }
        });

        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm('This will overwrite your current input. Do you want to continue?');
                if (!proceed) return;
            }
            const samples = window.SampleData.sobjectIdDecoder;
            inputEl.value = [samples.standard, samples.caseSafe, samples.custom].filter(Boolean).join('\n');
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
    container.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:600px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)';
    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = 'margin:0 0 16px;color:#333;font-size:14px;text-align:center';
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'width:100%;min-height:200px;padding:12px;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box;margin-bottom:16px';
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