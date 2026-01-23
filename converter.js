document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const delimiterEl = document.getElementById('delimiter');
    const customDelimiterEl = document.getElementById('customDelimiter');
    const quoteTypeEl = document.getElementById('quoteType');
    const encloseTypeEl = document.getElementById('encloseType');
    const customEncloseStartEl = document.getElementById('customEncloseStart');
    const customEncloseEndEl = document.getElementById('customEncloseEnd');
    const customEncloseGroup = document.getElementById('customEncloseGroup');
    const optionTrimEl = document.getElementById('optionTrim');
    const optionUniqueEl = document.getElementById('optionUnique');
    const optionSortEl = document.getElementById('optionSort');
    const optionIgnoreEmptyEl = document.getElementById('optionIgnoreEmpty');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const copyBtn = document.getElementById('copyBtn');

    // Event Listeners for Processing
    const elementsToWatch = [
        inputEl, delimiterEl, customDelimiterEl, quoteTypeEl, encloseTypeEl,
        customEncloseStartEl, customEncloseEndEl,
        optionTrimEl, optionUniqueEl, optionSortEl, optionIgnoreEmptyEl
    ];

    elementsToWatch.forEach(el => {
        el.addEventListener('input', updateConversion);
        el.addEventListener('change', updateConversion); // For checkboxes/selects
    });

    // Special handler for Custom Delimiter visibility
    delimiterEl.addEventListener('change', () => {
        if (delimiterEl.value === 'custom') {
            customDelimiterEl.classList.remove('d-none');
            customDelimiterEl.focus();
        } else {
            customDelimiterEl.classList.add('d-none');
        }
    });

    // Special handler for Custom Enclosure visibility
    encloseTypeEl.addEventListener('change', () => {
        if (encloseTypeEl.value === 'custom') {
            customEncloseGroup.classList.remove('d-none');
            customEncloseStartEl.focus();
        } else {
            customEncloseGroup.classList.add('d-none');
        }
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        outputEl.select();
        navigator.clipboard.writeText(outputEl.value).then(() => {
            const toastEl = document.getElementById('copyToast');
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback
            document.execCommand('copy');
        });
    });

    // Main Conversion Logic
    function updateConversion() {
        // 1. Get raw input
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        // Update input stats
        inputStatsEl.textContent = `${lines.length} lines`;

        // 2. Process items
        let processedItems = [];

        // Flags
        const doTrim = optionTrimEl.checked;
        const doIgnoreEmpty = optionIgnoreEmptyEl.checked;
        const doUnique = optionUniqueEl.checked;
        const doSort = optionSortEl.checked;
        const quoteType = quoteTypeEl.value;
        const encloseType = encloseTypeEl.value;

        // Determine delimiter
        let delim = delimiterEl.value;
        if (delim === 'custom') {
            delim = customDelimiterEl.value;
        } else if (delim === '\\n') {
            delim = '\n';
        }

        // Processing Loop
        processedItems = lines
            .map(line => doTrim ? line.trim() : line)       // Trim
            .filter(line => !doIgnoreEmpty || line !== ''); // Filter Empty

        // Remove Duplicates if requested
        if (doUnique) {
            processedItems = [...new Set(processedItems)];
        }

        // Sort if requested
        if (doSort) {
            processedItems.sort(); // Lexicographical sort
        }

        // Apply Quotes
        if (quoteType === 'single') {
            processedItems = processedItems.map(item => `'${item}'`);
        } else if (quoteType === 'double') {
            processedItems = processedItems.map(item => `"${item}"`);
        }

        // 3. Join
        let result = processedItems.join(delim);

        // 4. Enclose Result
        if (processedItems.length > 0) { // Only enclose if there is content
            if (encloseType === 'parentheses') {
                result = `(${result})`;
            } else if (encloseType === 'brackets') {
                result = `[${result}]`;
            } else if (encloseType === 'curly') {
                result = `{${result}}`;
            } else if (encloseType === 'custom') {
                result = `${customEncloseStartEl.value}${result}${customEncloseEndEl.value}`;
            }
        }

        // 5. Output
        outputEl.value = result;
        outputStatsEl.textContent = `${processedItems.length} items`;
    }

    // --- History Logic ---
    const saveBtn = document.getElementById('saveBtn');
    const historyTableBody = document.getElementById('historyTableBody');
    const historyCountEl = document.getElementById('historyCount');
    let sessionHistory = [];
    const HISTORY_LIMIT = 20;

    saveBtn.addEventListener('click', () => {
        const result = outputEl.value;
        if (!result) return; // Don't save empty results

        const timestamp = new Date().toLocaleTimeString();
        const itemCount = outputStatsEl.textContent; // "X items"

        // Truncate preview
        let preview = result.length > 100 ? result.substring(0, 100) + '...' : result;

        const newItem = {
            id: Date.now(),
            timestamp,
            itemCount,
            preview,
            fullResult: result
        };

        // Add to history (newest first)
        sessionHistory.unshift(newItem);

        // Enforce Limit
        if (sessionHistory.length > HISTORY_LIMIT) {
            sessionHistory.pop();
        }

        renderHistory();

        // Show subtle feedback
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="bi bi-check"></i> Saved';
        setTimeout(() => saveBtn.innerHTML = originalText, 1500);
    });

    function renderHistory() {
        historyCountEl.textContent = `${sessionHistory.length}/${HISTORY_LIMIT}`;

        if (sessionHistory.length === 0) {
            historyTableBody.innerHTML = `
                <tr class="text-center">
                    <td colspan="4" class="py-4 text-secondary opacity-50 fst-italic">No saved results in this session.</td>
                </tr>`;
            return;
        }

        historyTableBody.innerHTML = '';
        sessionHistory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="align-middle text-secondary">${item.timestamp}</td>
                <td class="align-middle text-info">${item.itemCount}</td>
                <td class="align-middle text-truncate" style="max-width: 300px;">
                    <code class="text-light">${escapeHtml(item.preview)}</code>
                </td>
                <td class="align-middle text-end">
                    <button class="btn btn-sm btn-link text-primary p-0 me-2" onclick="copyFromHistory(${item.id})" title="Copy">
                        <i class="bi bi-clipboard"></i>
                    </button>
                    <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteFromHistory(${item.id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            historyTableBody.appendChild(row);
        });
    }

    // Helper to escape HTML for preview
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose actions globally for inline onclick handlers
    window.copyFromHistory = (id) => {
        const item = sessionHistory.find(i => i.id === id);
        if (item) {
            navigator.clipboard.writeText(item.fullResult).then(() => {
                const toastEl = document.getElementById('copyToast');
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            });
        }
    };

    window.deleteFromHistory = (id) => {
        sessionHistory = sessionHistory.filter(i => i.id !== id);
        renderHistory();
    };
});
