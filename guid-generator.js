// --- GUID Generation ---
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
        const generateBtn = document.getElementById('generateBtn');
        const copyResultBtn = document.getElementById('copyResultBtn');
        const outputEl = document.getElementById('output');
        const historyTableBody = document.getElementById('historyTableBody');
        const statusTextEl = document.getElementById('statusText');

        let sessionHistory = [];
        const HISTORY_LIMIT = 20;

        // UX: Clear input on focus
        guidCountEl.addEventListener('focus', () => {
            guidCountEl.value = '';
        });

        generateBtn.addEventListener('click', () => {
            let count = parseInt(guidCountEl.value) || 1;

            // Enforce limit of 20
            if (count > 20) {
                count = 20;
                guidCountEl.value = 20;
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
            const items = result.split('\n');
            const count = items.length;
            const timestamp = new Date().toLocaleTimeString();
            const firstLine = items[0];

            const newItem = {
                id: Date.now(),
                timestamp,
                count,
                preview: firstLine,
                result
            };

            sessionHistory.unshift(newItem);
            if (sessionHistory.length > HISTORY_LIMIT) sessionHistory.pop();

            renderHistory();
        });

        // --- Global Actions (attached to window for inline onclick) ---
        window.copyHistoryItem = (id) => {
            const item = sessionHistory.find(i => i.id === id);
            if (item) {
                copyToClipboard(item.result, 'Copied from history.');
                statusTextEl.textContent = 'Copied from history.';
            }
        };

        window.deleteHistoryItem = (id) => {
            sessionHistory = sessionHistory.filter(i => i.id !== id);
            renderHistory();
            statusTextEl.textContent = 'Deleted from history.';
        };

        function renderHistory() {
            if (sessionHistory.length === 0) {
                historyTableBody.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4" class="py-4 text-secondary opacity-50 fst-italic">No saved history.</td>
                    </tr>`;
                return;
            }

            historyTableBody.innerHTML = '';
            sessionHistory.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="align-middle text-secondary">${item.timestamp}</td>
                    <td class="align-middle text-info">${item.count}</td>
                    <td class="align-middle text-truncate" style="max-width: 300px;">
                        <code class="text-light">${item.preview}</code>
                    </td>
                    <td class="align-middle text-end">
                        <button class="btn btn-sm btn-link text-primary p-0 me-2" onclick="copyHistoryItem(${item.id})" title="Copy">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteHistoryItem(${item.id})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                historyTableBody.appendChild(tr);
            });
        }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
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
