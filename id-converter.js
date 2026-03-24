document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const optionSoqlEl = document.getElementById('optionSoql');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const validationMessageEl = document.getElementById('validationMessage');
    const validationTextEl = document.getElementById('validationText');
    const copyBtn = document.getElementById('copyBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    // Event Listeners
    inputEl.addEventListener('input', updateConversion);
    optionSoqlEl.addEventListener('change', updateConversion);

    // --- Core Logic ---

    function updateConversion() {
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        let validIds = 0;
        let invalidIds = 0;
        let processedIds = [];

        inputStatsEl.textContent = `${lines.length} lines`;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // Skip empty lines

            // Validate
            if (trimmed.length === 15 || trimmed.length === 18) {
                const converted = to18CharId(trimmed);
                processedIds.push(converted);
                validIds++;
            } else {
                // Invalid ID length
                processedIds.push(trimmed + " [INVALID]");
                invalidIds++;
            }
        });

        // Toggle Output
        let result = "";
        const isSoql = optionSoqlEl.checked;

        if (isSoql) {
            // Filter out invalids for clean query? Or keep them?
            // Usually for SOQL you want only valid strings
            // Let's keep them but formatted strings
            const formatted = processedIds.map(id => {
                if (id.includes("[INVALID]")) return id; // Don't quote invalids
                return `'${id}'`;
            });
            result = formatted.join(', ');
        } else {
            result = processedIds.join('\n');
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
