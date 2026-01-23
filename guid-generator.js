document.addEventListener('DOMContentLoaded', () => {
    const guidCountEl = document.getElementById('guidCount');
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const outputEl = document.getElementById('output');
    const historyListEl = document.getElementById('historyList');
    const statusTextEl = document.getElementById('statusText');

    let sessionHistory = [];
    const HISTORY_LIMIT = 20;

    // --- GUID Generation ---
    function generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    generateBtn.addEventListener('click', () => {
        const count = parseInt(guidCountEl.value) || 1;
        const guids = [];

        for (let i = 0; i < count; i++) {
            guids.push(generateGUID());
        }

        outputEl.value = guids.join('\n');
        saveBtn.disabled = false;
        statusTextEl.textContent = `Generated ${count} GUIDs.`;
    });

    // --- History Logic ---
    saveBtn.addEventListener('click', () => {
        const result = outputEl.value;
        if (!result) return;

        const count = result.split('\n').length;
        const timestamp = new Date().toLocaleTimeString();

        const newItem = {
            id: Date.now(),
            timestamp,
            count,
            result
        };

        sessionHistory.unshift(newItem);
        if (sessionHistory.length > HISTORY_LIMIT) sessionHistory.pop();

        renderHistory();
        statusTextEl.textContent = 'Saved to history.';
        saveBtn.disabled = true; // Prevent double save
    });

    // --- Global Actions (attached to window for inline onclick) ---
    window.copyHistoryItem = (id) => {
        const item = sessionHistory.find(i => i.id === id);
        if (item) {
            navigator.clipboard.writeText(item.result);
            statusTextEl.textContent = 'Copied to clipboard.';
        }
    };

    window.deleteHistoryItem = (id) => {
        sessionHistory = sessionHistory.filter(i => i.id !== id);
        renderHistory();
        statusTextEl.textContent = 'Deleted from history.';
    };

    function renderHistory() {
        if (sessionHistory.length === 0) {
            historyListEl.innerHTML = '<div style="text-align: center; color: #888; margin-top: 20px;">No saved history.</div>';
            return;
        }

        historyListEl.innerHTML = '';
        sessionHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span>${item.timestamp} - <strong>${item.count} GUIDs</strong></span>
                <div class="history-actions">
                    <button onclick="copyHistoryItem(${item.id})" title="Copy">C</button>
                    <button onclick="deleteHistoryItem(${item.id})" title="Delete">X</button>
                </div>
            `;
            historyListEl.appendChild(div);
        });
    }
});
