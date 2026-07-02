document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const btnFormat = document.getElementById('btnFormat');
    const btnMinify = document.getElementById('btnMinify');
    const indentSizeEl = document.getElementById('indentSize');
    const copyBtn = document.getElementById('copyBtn');
    const validationMessage = document.getElementById('validationMessage');
    const validationText = document.getElementById('validationText');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    const history = new HistoryManager({
        getType: (item) => item.mode || 'XML',
        getPreview: (item) => (item.preview || '').substring(0, 100)
    });

    let currentMode = 'format'; // 'format' or 'minify'

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            inputEl.value = window.SampleData.xmlFormatter;

            // Set to format mode
            btnFormat.click();
            indentSizeEl.value = '4';
            processXml();
        });
    }

    // Event Listeners
    inputEl.addEventListener('input', () => {
        updateStats();
        processXml();
    });

    btnFormat.addEventListener('click', () => {
        currentMode = 'format';
        btnFormat.classList.remove('btn-outline-primary');
        btnFormat.classList.add('btn-primary');
        btnMinify.classList.remove('btn-secondary');
        btnMinify.classList.add('btn-outline-secondary');
        processXml();
    });

    btnMinify.addEventListener('click', () => {
        currentMode = 'minify';
        btnMinify.classList.remove('btn-outline-secondary');
        btnMinify.classList.add('btn-secondary');
        btnFormat.classList.remove('btn-primary');
        btnFormat.classList.add('btn-outline-primary');
        processXml();
    });

    indentSizeEl.addEventListener('change', () => {
        if(currentMode === 'format') processXml();
    });

    // Global func for clear button
    window.updateFormat = () => {
        updateStats();
        processXml();
    };

    function updateStats() {
        const val = inputEl.value;
        inputStatsEl.textContent = `${val.length} characters`;
    }

    function processXml() {
        const rawXml = inputEl.value.trim();

        if (!rawXml) {
            outputEl.value = '';
            outputStatsEl.textContent = '0 characters';
            hideError();
            return;
        }

        try {
            // First check if it's actually parsable XML to catch errors
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rawXml, "text/xml");

            // Check for parse errors
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                throw new Error(parseError[0].textContent);
            }

            // Since it's valid, we can process it
            let result = '';
            if (currentMode === 'format') {
                const indentVal = indentSizeEl.value;
                const indentStr = indentVal === 'tab' ? '\t' : ' '.repeat(parseInt(indentVal, 10));
                // Minify first to normalize existing whitespace and newlines before formatting
                const normalizedXml = minifyXml(rawXml);
                result = formatXml(normalizedXml, indentStr);
            } else {
                result = minifyXml(rawXml);
            }

            outputEl.value = result;
            outputStatsEl.textContent = `${result.length} characters`;
            hideError();

            history.add({
                value: result,
                mode: currentMode === 'format' ? 'Format' : 'Minify',
                preview: result.substring(0, 100)
            });

        } catch (e) {
            showError("Invalid XML: " + e.message);
        }
    }

    // Basic regex-based XML formatter
    function formatXml(xml, indent) {
        let formatted = '';
        let pad = 0;

        // Remove existing formatting
        xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');

        const lines = xml.split('\r\n');

        lines.forEach(function(node) {
            let indentStr = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indentStr = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indentStr = 1;
            } else {
                indentStr = 0;
            }

            let padding = '';
            for (let i = 0; i < pad; i++) {
                padding += indent;
            }

            formatted += padding + node + '\r\n';
            pad += indentStr;
        });

        // Trim the extra newline at the end
        return formatted.trim();
    }

    function minifyXml(xml) {
        // Remove spaces between tags, and normalize whitespace
        return xml.replace(/\>[\r\n ]+\</g, "><").replace(/(<[^\/>]+>)\s+(<\/[^>]+>)/g, "$1$2").trim();
    }

    function showError(msg) {
        validationMessage.classList.remove('d-none');
        validationText.textContent = msg;
        inputEl.classList.add('border-danger');
    }

    function hideError() {
        validationMessage.classList.add('d-none');
        inputEl.classList.remove('border-danger');
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        outputEl.select();
        copyToClipboard(outputEl.value, 'XML copied to clipboard!');
    });
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
