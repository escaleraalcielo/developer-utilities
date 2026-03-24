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

    // Copy to Clipboard logic is handled at the bottom


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

        // Store items for validation before quoting
        // Optimization: since we no longer modify processedItems directly, we don't need to clone the array
        const itemsForValidation = processedItems;

        // 3. Join & Apply Quotes
        let result = '';
        if (processedItems.length > 0) {
            if (quoteType === 'single') {
                result = `'${processedItems.join(`'${delim}'`)}'`;
            } else if (quoteType === 'double') {
                result = `"${processedItems.join(`"${delim}"`)}"`;
            } else {
                result = processedItems.join(delim);
            }
        }

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

        // 6. Validation / Conflict Detection
        validateConflicts(rawInput, itemsForValidation, {
            delimiter: delim,
            quoteType: quoteType,
            encloseType: encloseType
        });

        // Save Settings
        saveSettings();
    }

    function validateConflicts(rawInput, processedItems, settings) {
        const warningEl = document.getElementById('conversionWarning');
        const warningMsgEl = document.getElementById('conversionWarningMsg');
        let conflicts = [];

        // Performance Optimization: Consolidate multiple .some() calls into a single loop
        const checkDelimiter = settings.delimiter && settings.delimiter !== '\n';
        const checkSingle = settings.quoteType === 'single';
        const checkDouble = settings.quoteType === 'double';
        const checkParentheses = settings.encloseType === 'parentheses';
        const checkBrackets = settings.encloseType === 'brackets';

        let hasDelimiter = false;
        let hasSingle = false;
        let hasDouble = false;
        let hasParentheses = false;
        let hasBrackets = false;

        for (let i = 0; i < processedItems.length; i++) {
            const item = processedItems[i];
            if (checkDelimiter && !hasDelimiter && item.includes(settings.delimiter)) {
                hasDelimiter = true;
            }
            if (checkSingle && !hasSingle && item.includes("'")) {
                hasSingle = true;
            }
            if (checkDouble && !hasDouble && item.includes('"')) {
                hasDouble = true;
            }
            if (checkParentheses && !hasParentheses && (item.includes('(') || item.includes(')'))) {
                hasParentheses = true;
            }
            if (checkBrackets && !hasBrackets && (item.includes('[') || item.includes(']'))) {
                hasBrackets = true;
            }

            // Early exit if all active checks are already true
            if ((!checkDelimiter || hasDelimiter) &&
                (!checkSingle || hasSingle) &&
                (!checkDouble || hasDouble) &&
                (!checkParentheses || hasParentheses) &&
                (!checkBrackets || hasBrackets)) {
                break;
            }
        }

        if (hasDelimiter) conflicts.push(`Input contains the delimiter "<strong>${escapeHtml(settings.delimiter)}</strong>"`);
        if (hasSingle) conflicts.push(`Input contains <strong>Single Quotes</strong>`);
        if (hasDouble) conflicts.push(`Input contains <strong>Double Quotes</strong>`);
        if (hasParentheses) conflicts.push('Input contains <strong>Parentheses</strong>');
        if (hasBrackets) conflicts.push('Input contains <strong>Brackets</strong>');

        // Update UI
        if (conflicts.length > 0) {
            warningMsgEl.innerHTML = `Possible format issue: ${conflicts.join(', ')}.`;
            warningEl.classList.remove('d-none');

            // Visual indicators
            inputEl.classList.add('border-warning');
            outputEl.classList.add('border-warning');
        } else {
            warningEl.classList.add('d-none');
            inputEl.classList.remove('border-warning');
            outputEl.classList.remove('border-warning');
        }
    }

    // --- Persistence Logic ---
    const STORAGE_KEY = 'devUtils_colConverter_settings';

    function saveSettings() {
        const settings = {
            delimiter: delimiterEl.value,
            customDelimiter: customDelimiterEl.value,
            quoteType: quoteTypeEl.value,
            encloseType: encloseTypeEl.value,
            customEncloseStart: customEncloseStartEl.value,
            customEncloseEnd: customEncloseEndEl.value,
            optionTrim: optionTrimEl.checked,
            optionUnique: optionUniqueEl.checked,
            optionSort: optionSortEl.checked,
            optionIgnoreEmpty: optionIgnoreEmptyEl.checked
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        try {
            const settings = JSON.parse(saved);

            if (settings.delimiter) delimiterEl.value = settings.delimiter;
            if (settings.customDelimiter) customDelimiterEl.value = settings.customDelimiter;
            if (settings.quoteType) quoteTypeEl.value = settings.quoteType;
            if (settings.encloseType) encloseTypeEl.value = settings.encloseType;
            if (settings.customEncloseStart) customEncloseStartEl.value = settings.customEncloseStart;
            if (settings.customEncloseEnd) customEncloseEndEl.value = settings.customEncloseEnd;

            if (typeof settings.optionTrim === 'boolean') optionTrimEl.checked = settings.optionTrim;
            if (typeof settings.optionUnique === 'boolean') optionUniqueEl.checked = settings.optionUnique;
            if (typeof settings.optionSort === 'boolean') optionSortEl.checked = settings.optionSort;
            if (typeof settings.optionIgnoreEmpty === 'boolean') optionIgnoreEmptyEl.checked = settings.optionIgnoreEmpty;

            // Trigger visibility updates
            delimiterEl.dispatchEvent(new Event('change'));
            encloseTypeEl.dispatchEvent(new Event('change'));

        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    // Load on init
    loadSettings();

    const saveBtn = document.getElementById('saveBtn');
    const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
    const historyTableBody = document.getElementById('historyTableBody');
    const historyCountEl = document.getElementById('historyCount');
    let sessionHistory = [];
    const HISTORY_LIMIT = 20;

    resetDefaultsBtn.addEventListener('click', () => {
        resetToDefaults();
        // Provide feedback
        const originalText = resetDefaultsBtn.innerHTML;
        resetDefaultsBtn.innerHTML = '<i class="bi bi-check"></i> Loaded';
        setTimeout(() => resetDefaultsBtn.innerHTML = originalText, 1500);
    });

    function resetToDefaults() {
        delimiterEl.value = ',';
        delimiterEl.dispatchEvent(new Event('change')); // Update UI visibility
        customDelimiterEl.value = '';

        quoteTypeEl.value = 'single';

        encloseTypeEl.value = 'none';
        encloseTypeEl.dispatchEvent(new Event('change')); // Update UI visibility
        customEncloseStartEl.value = '';
        customEncloseEndEl.value = '';

        // Save immediately
        saveSettings();

        // Trigger conversion if input exists
        if (inputEl.value) {
            updateConversion();
        }
    }

    function saveToHistory() {
        const result = outputEl.value;
        if (!result) return;

        // Check if already top item to prevent duplicates
        if (sessionHistory.length > 0 && sessionHistory[0].fullResult === result) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const itemCount = outputStatsEl.textContent;

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
    }

    saveBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        saveToHistory();

        // Also copy to clipboard when saved
        outputEl.select();
        copyToClipboard(outputEl.value, 'List saved to history and copied to clipboard!');

        // Show subtle feedback
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="bi bi-check"></i> Saved';
        setTimeout(() => saveBtn.innerHTML = originalText, 1500);
    });

    // Enhanced Copy Handler with Auto-Save
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        // 1. Auto-save immediately
        saveToHistory();

        // 2. Perform Copy
        outputEl.select();
        copyToClipboard(outputEl.value, 'List copied to clipboard!');
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

    // Expose actions globally for inline onclick handlers
    window.copyFromHistory = (id) => {
        const item = sessionHistory.find(i => i.id === id);
        if (item) {
            copyToClipboard(item.fullResult, 'Copied from history!');
        }
    };

    window.deleteFromHistory = (id) => {
        sessionHistory = sessionHistory.filter(i => i.id !== id);
        renderHistory();
    };
});



function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
