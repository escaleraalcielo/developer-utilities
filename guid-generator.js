// --- GUID Generation ---
function generateGUID() {
    // Use the built-in, cryptographically secure randomUUID if available (Node.js 14.17+, modern browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback to crypto.getRandomValues for older but still modern browsers
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Insecure fallback for very old browsers or non-secure contexts
    // Included to preserve functionality in environments lacking secure crypto APIs
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateGUID };
}

// Ensure generateGUID is also available on window for easier browser testing if needed
if (typeof window !== 'undefined') {
    window.generateGUID = generateGUID;
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const guidCountEl = document.getElementById('guidCount');
        const guidCountSlider = document.getElementById('guidCountSlider');
        const generateBtn = document.getElementById('generateBtn');
        const copyResultBtn = document.getElementById('copyResultBtn');
        const outputEl = document.getElementById('output');
        const statusTextEl = document.getElementById('statusText');

        const history = new HistoryManager({
            getType: () => 'GUID',
            getPreview: (item) => (item.preview || '').substring(0, 100)
        });

        // Slider logic
        const sliderValues = [1, 2, 3, 4, 5, 10, 15, 20];

        guidCountSlider.addEventListener('input', (e) => {
            const index = parseInt(e.target.value);
            guidCountEl.value = sliderValues[index];
        });

        guidCountEl.addEventListener('input', (e) => {
            let val = parseInt(e.target.value) || 1;

            // Find closest value in sliderValues
            let closestIndex = 0;
            let minDiff = Infinity;

            sliderValues.forEach((num, index) => {
                const diff = Math.abs(num - val);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = index;
                }
            });

            guidCountSlider.value = closestIndex;
        });

        // UX: Clear input on focus
        guidCountEl.addEventListener('focus', () => {
            guidCountEl.value = '';
        });

        generateBtn.addEventListener('click', () => {
            let count = parseInt(guidCountEl.value) || 1;

            // Enforce limits
            if (count > 20) {
                count = 20;
                guidCountEl.value = 20;
                guidCountSlider.value = sliderValues.length - 1;
            } else if (count < 1) {
                count = 1;
                guidCountEl.value = 1;
                guidCountSlider.value = 0;
            }

            const guids = [];

            for (let i = 0; i < count; i++) {
                guids.push(generateGUID());
            }

            outputEl.value = guids.join('\n');
            copyResultBtn.disabled = false;
            statusTextEl.textContent = `Generated ${count} GUIDs.`;
        });

        // --- Copy & History Logic ---
        copyResultBtn.addEventListener('click', () => {
            const result = outputEl.value;
            if (!result) return;

            // 1. Copy to Clipboard
            copyToClipboard(result, 'Copied and Saved to History.');
            statusTextEl.textContent = 'Copied and Saved to History.';

            // 2. Add to History
            history.add({ value: result, preview: result.split('\n')[0].substring(0, 100) });
        });
    });
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
