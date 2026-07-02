document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const optionSoqlEl = document.getElementById('optionSoql');
    const optionCleanEl = document.getElementById('optionClean');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const validationMessageEl = document.getElementById('validationMessage');
    const validationTextEl = document.getElementById('validationText');
    const copyBtn = document.getElementById('copyBtn');
    const removedContainer = document.getElementById('removedContainer');
    const removedDataEl = document.getElementById('removedData');

    const history = new HistoryManager({
        getType: () => 'SF ID',
        getPreview: (item) => (item.preview || '').substring(0, 100)
    });

    function recordHistory() {
        if (!outputEl.value) return;
        history.add({ value: outputEl.value, preview: outputEl.value.substring(0, 100) });
    }

    // Event Listeners
    inputEl.addEventListener('input', updateConversion);
    optionSoqlEl.addEventListener('change', updateConversion);
    optionCleanEl.addEventListener('change', updateConversion);

    // --- Core Logic ---

    function updateConversion() {
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        let validIds = 0;
        let invalidIds = 0;
        let processedIds = [];
        let cleanValidIds = [];
        let cleanInvalidIds = [];

        inputStatsEl.textContent = `${lines.length} lines`;
        const isClean = optionCleanEl.checked;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // Skip empty lines

            // Validate
            if (trimmed.length === 15 || trimmed.length === 18) {
                const converted = to18CharId(trimmed);
                processedIds.push(converted);
                cleanValidIds.push(converted);
                validIds++;
            } else {
                // Invalid ID length
                processedIds.push(trimmed + " [INVALID]");
                cleanInvalidIds.push(trimmed); // plain unformatted for clean list
                invalidIds++;
            }
        });

        // Toggle Output
        let result = "";
        const isSoql = optionSoqlEl.checked;

        if (isClean) {
            if (isSoql) {
                const formatted = cleanValidIds.map(id => `'${id}'`);
                result = formatted.join(', ');
            } else {
                result = cleanValidIds.join('\n');
            }
            removedDataEl.value = cleanInvalidIds.join('\n');

            if (invalidIds > 0) {
                removedContainer.classList.remove('d-none');
                removedContainer.classList.add('d-flex');
            } else {
                removedContainer.classList.add('d-none');
                removedContainer.classList.remove('d-flex');
            }
        } else {
            removedContainer.classList.add('d-none');
            removedContainer.classList.remove('d-flex');

            if (isSoql) {
                const formatted = processedIds.map(id => {
                    if (id.includes("[INVALID]")) return id; // Don't quote invalids
                    return `'${id}'`;
                });
                result = formatted.join(', ');
            } else {
                result = processedIds.join('\n');
            }
        }

        outputEl.value = result;
        outputStatsEl.textContent = `${validIds} valid, ${invalidIds} invalid`;

        // Validation UI
        if (invalidIds > 0) {
            validationMessageEl.classList.remove('d-none');
            validationTextEl.textContent = `${invalidIds} invalid ID(s) detected.`;
            inputEl.classList.add('border-warning');
        } else {
            validationMessageEl.classList.add('d-none');
            inputEl.classList.remove('border-warning');
        }
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        outputEl.select();
        copyToClipboard(outputEl.value, 'IDs copied to clipboard!');
        recordHistory();
    });

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            inputEl.value = window.SampleData.idConverter;

            optionSoqlEl.checked = true;
            updateConversion();
            recordHistory();
        });
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

function fallbackCopyTextToClipboard(text, successMessage) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = `
        margin: 0 0 16px 0;
        color: #333;
        font-size: 14px;
        font-weight: 500;
    `;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
        width: 100%;
        min-height: 120px;
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

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        background: #0d6efd;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        float: right;
    `;

    container.appendChild(instruction);
    container.appendChild(textarea);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    textarea.focus();
    textarea.select();

    const closeModal = () => {
        document.body.removeChild(overlay);
        showToast(successMessage);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', escHandler);
            closeModal();
        }
    });
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
