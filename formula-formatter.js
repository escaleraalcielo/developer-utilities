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
    });

    /**
     * Basic Salesforce Formula Formatter
     * - Breaks on functions
     * - Indents based on parenthesis depth
     * - Respects logical operators
     */
    function formatSalesforceFormula(formula, indentStr) {
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
});



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

function fallbackCopyTextToClipboard(text, successMessage) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        if (successful) {
            showToast(successMessage);
        } else {
            console.error('Fallback: Copying text command was unsuccessful');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}
