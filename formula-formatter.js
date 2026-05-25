if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // DOM Elements
        const inputFormula = document.getElementById('inputFormula');
    const outputFormula = document.getElementById('outputFormula');
    const formatBtn = document.getElementById('formatBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const indentSelect = document.getElementById('indentSelect');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (inputFormula.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            inputFormula.value = window.SampleData.formulaFormatter;
            indentSelect.value = '4';
            formatBtn.click();
        });
    }

    // Auto-resize for textarea if needed, but we use flex layout

    formatBtn.addEventListener('click', () => {
        const raw = inputFormula.value;
        if (!raw.trim()) return;

        let indentChar = indentSelect.value;
        if (indentChar === '2') {
            indentChar = '  ';
        } else if (indentChar === '4') {
            indentChar = '    ';
        }

        const formatted = formatSalesforceFormula(raw, indentChar);
        outputFormula.value = formatted;
        copyBtn.disabled = false;
        saveBtn.disabled = false;
    });

    saveBtn.addEventListener('click', () => {
        if (!outputFormula.value) return;
        const blob = new Blob([outputFormula.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted_formula.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    copyBtn.addEventListener('click', () => {
        if (!outputFormula.value) return;
        outputFormula.select();
        copyToClipboard(outputFormula.value, 'Formula copied to clipboard!');
    });

    clearBtn.addEventListener('click', () => {
        inputFormula.value = '';
        outputFormula.value = '';
        copyBtn.disabled = true;
        saveBtn.disabled = true;
    });
    });
}

/**
 * Basic Salesforce Formula Formatter
 * - Breaks on functions
 * - Indents based on parenthesis depth
 * - Respects logical operators
 */
function formatSalesforceFormula(formula, indentStr) {
    if (!formula) return '';

    // 1. Remove all existing line breaks and extra spaces
    let clean = formula.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    let result = '';
    let indentLevel = 0;
    let inQuotes = false;

        // Function to generate indentation
        const getIndent = (level) => indentStr.repeat(Math.max(0, level));

        for (let i = 0; i < clean.length; i++) {
            let char = clean[i];

            // Toggle string literals (single or double quotes)
            if (char === "'" || char === '"') {
                inQuotes = !inQuotes;
                result += char;
                continue;
            }

            if (inQuotes) {
                result += char;
                continue;
            }

            // Handle structure
            if (char === '(') {
                indentLevel++;
                result += '(\n' + getIndent(indentLevel);
                // remove following space if it exists
                if (i + 1 < clean.length && clean[i+1] === ' ') i++;
            } else if (char === ')') {
                indentLevel--;
                result += '\n' + getIndent(indentLevel) + ')';
            } else if (char === ',') {
                result += ',\n' + getIndent(indentLevel);
                if (i + 1 < clean.length && clean[i+1] === ' ') i++;
            } else if (char === ' ') {
                // Formatting specific operators (AND, OR, &&, ||)
                // We'll leave them inline unless they are followed by complex expressions,
                // but for simplicity we keep single space.
                result += char;
            } else {
                result += char;
            }
        }

        // Post-processing to clean up any empty lines or double indents
        return result.replace(/\n\s*\n/g, '\n').trim();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatSalesforceFormula };
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
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }
}

function fallbackCopyTextToClipboard(text, successMessage) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'copyFallbackOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create container
    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    // Instruction text
    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = `
        margin: 0 0 16px 0;
        color: #333;
        font-size: 14px;
        text-align: center;
    `;

    // Textarea with content
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
        width: 100%;
        min-height: 150px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: monospace;
        font-size: 13px;
        resize: vertical;
        box-sizing: border-box;
        margin-bottom: 16px;
    `;
    textarea.readOnly = true;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        background: #0d6efd;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        display: block;
        margin: 0 auto;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#0b5ed7';
    closeBtn.onmouseout = () => closeBtn.style.background = '#0d6efd';

    // Close function
    const closeOverlay = () => {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
    };

    closeBtn.addEventListener('click', closeOverlay);

    // Close on overlay click (outside container)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeOverlay();
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Assemble and show
    container.appendChild(instruction);
    container.appendChild(textarea);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Auto-focus and select
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
