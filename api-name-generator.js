document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputLabels = document.getElementById('inputLabels');
    const outputNames = document.getElementById('outputNames');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const suffixSelect = document.getElementById('suffixSelect');
    const inputCount = document.getElementById('inputCount');
    const outputCount = document.getElementById('outputCount');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    const history = new HistoryManager({
        getType: () => 'API Name',
        getPreview: (item) => (item.preview || '').substring(0, 100)
    });

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (inputLabels.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            inputLabels.value = window.SampleData.apiNameGenerator;
            suffixSelect.value = '__c';

            // Trigger input event to update count
            const inputEvent = new Event('input');
            inputLabels.dispatchEvent(inputEvent);

            // Trigger generation
            generateBtn.click();
        });
    }

    // Real-time counting
    inputLabels.addEventListener('input', () => {
        const text = inputLabels.value.trim();
        const count = text ? text.split('\n').filter(line => line.trim().length > 0).length : 0;
        inputCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    });

    // Generate API Names
    generateBtn.addEventListener('click', () => {
        const text = inputLabels.value;
        if (!text.trim()) return;

        const suffix = suffixSelect.value;
        const labels = text.split('\n');
        const apiNames = labels.map(label => {
            const trimmed = label.trim();
            if (!trimmed) return '';
            return generateApiName(trimmed, suffix);
        });

        outputNames.value = apiNames.join('\n');

        const count = apiNames.filter(name => name.length > 0).length;
        outputCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;

        copyBtn.disabled = count === 0;

        if (count > 0) {
            const outputString = apiNames.join('\n');
            history.add({ value: outputString, preview: outputString.substring(0, 100) });
        }
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!outputNames.value) return;
        outputNames.select();
        copyToClipboard(outputNames.value, 'API names copied!');
    });

    // Clear Logic
    clearBtn.addEventListener('click', () => {
        inputLabels.value = '';
        outputNames.value = '';
        inputCount.textContent = '0 items';
        outputCount.textContent = '0 items';
        copyBtn.disabled = true;
    });

    // Core Salesforce API Name Generation Logic
    function generateApiName(label, suffix) {
        // 1. Convert to Title Case for better readability (optional but standard practice)
        // or just keep original casing and only replace invalid chars.
        // We'll preserve case but replace invalid chars with underscores.

        // Replace accented characters with basic Latin equivalents
        let name = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // 2. Replace any non-alphanumeric character (spaces, symbols, hyphens) with underscore
        name = name.replace(/[^a-zA-Z0-9]/g, '_');

        // 3. Remove consecutive underscores
        name = name.replace(/_+/g, '_');

        // 4. Ensure it doesn't start with a number or underscore
        if (/^[0-9_]/.test(name)) {
            name = name.replace(/^_+/, ''); // Remove leading underscores
            if (/^[0-9]/.test(name)) {
                name = 'X' + name; // Prefix with X if it starts with a number
            }
        }

        // 5. Ensure it doesn't end with an underscore
        name = name.replace(/_+$/, '');

        // 6. Max length limit in Salesforce is 40 characters for Custom Fields/Objects (including suffix)
        // Adjusting max length to 40 - suffix.length
        const maxLength = 40 - suffix.length;
        if (name.length > maxLength) {
            name = name.substring(0, maxLength);
            // Re-trim ending underscore if substring cut it on an underscore
            name = name.replace(/_+$/, '');
        }

        return name + suffix;
    }
});

// For testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateApiName: function(label, suffix) {
        // We need to re-implement it here to expose it since it's nested
        let name = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        name = name.replace(/[^a-zA-Z0-9]/g, '_');
        name = name.replace(/_+/g, '_');
        if (/^[0-9_]/.test(name)) {
            name = name.replace(/^_+/, '');
            if (/^[0-9]/.test(name)) {
                name = 'X' + name;
            }
        }
        name = name.replace(/_+$/, '');
        const maxLength = 40 - suffix.length;
        if (name.length > maxLength) {
            name = name.substring(0, maxLength);
            name = name.replace(/_+$/, '');
        }
        return name + suffix;
    }};
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
