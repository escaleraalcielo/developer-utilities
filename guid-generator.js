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
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(result).then(() => {
                    statusTextEl.textContent = 'Copied and Saved to History.';
                }).catch(err => {
                    statusTextEl.textContent = 'Copy failed, but saved to history.';
                });
            } else {
                 statusTextEl.textContent = 'Clipboard not available, but saved to history.';
            }

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
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(item.result);
                }
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
                        <code class="text-light">${escapeHtml(item.preview)}</code>
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
            if (typeof document === 'undefined') return text;
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    });
}
