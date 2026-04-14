document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const copyBtn = document.getElementById('copyBtn');

    // File Upload Elements
    const logFileInput = document.getElementById('logFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');

    // Filters
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const customFilterEl = document.getElementById('customFilter');

    // Display Controls
    const highlightToggle = document.getElementById('highlightToggle');
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontSizeInput = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const resetDisplayBtn = document.getElementById('resetDisplayBtn');

    let originalFileName = '';
    let rawFilteredText = ''; // Store raw text for copy operations

    // Configuration
    const CONFIG_KEY = 'devutils-apex-config';
    const DEFAULT_CONFIG = {
        fontFamily: 'system',
        fontSize: 14,
        highlightEnabled: true
    };

    // Keyword categories for syntax highlighting
    const HIGHLIGHT_PATTERNS = {
        error: ['FATAL_ERROR', 'EXCEPTION_THROWN', 'ERROR', 'System.AssertException', 'System.DmlException', 'System.QueryException', 'System.NullPointerException', 'DUPLICATE_VALUE'],
        flow: ['SOQL_EXECUTE_BEGIN', 'SOQL_EXECUTE_END', 'DML_BEGIN', 'DML_END', 'CODE_UNIT_STARTED', 'CODE_UNIT_FINISHED', 'CONSTRUCTOR_ENTRY', 'CONSTRUCTOR_EXIT', 'METHOD_ENTRY', 'METHOD_EXIT', 'EXECUTION_STARTED', 'EXECUTION_FINISHED'],
        debug: ['USER_DEBUG', 'SYSTEM_DEBUG'],
        limit: ['LIMIT_USAGE_FOR_NS', 'CUMULATIVE_LIMIT_USAGE', 'CUMULATIVE_LIMIT_USAGE_END', 'HEAP_ALLOCATE', 'VARIABLE_SCOPE_BEGIN', 'STATEMENT_EXECUTE']
    };

    // Timestamp pattern: HH:MM:SS.NNN (NNNNNNN)
    const TIMESTAMP_PATTERN = /^\d{2}:\d{2}:\d{2}\.\d{3}\s*\(\d+\)/;

    // Event Listeners
    inputEl.addEventListener('input', updateFilter);
    customFilterEl.addEventListener('input', updateFilter);
    filterCheckboxes.forEach(cb => cb.addEventListener('change', updateFilter));

    // Display control listeners
    highlightToggle.addEventListener('change', () => {
        saveConfig();
        updateFilter();
    });

    fontFamilySelect.addEventListener('change', () => {
        applyFontFamily(fontFamilySelect.value);
        saveConfig();
    });

    fontSizeInput.addEventListener('input', () => {
        const size = parseInt(fontSizeInput.value, 10);
        fontSizeValue.textContent = size;
        applyFontSize(size);
    });

    fontSizeInput.addEventListener('change', () => {
        saveConfig();
    });

    resetDisplayBtn.addEventListener('click', resetToDefaults);

    // Global func for clear button
    window.updateFilter = updateFilter;

    // --- Configuration Management ---
    function loadConfig() {
        try {
            const stored = localStorage.getItem(CONFIG_KEY);
            if (stored) {
                const config = JSON.parse(stored);
                return { ...DEFAULT_CONFIG, ...config };
            }
        } catch (e) {
            console.warn('Failed to load config:', e);
        }
        return { ...DEFAULT_CONFIG };
    }

    function saveConfig() {
        try {
            const config = {
                fontFamily: fontFamilySelect.value,
                fontSize: parseInt(fontSizeInput.value, 10),
                highlightEnabled: highlightToggle.checked
            };
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('Failed to save config:', e);
        }
    }

    function applyConfig() {
        const config = loadConfig();

        // Apply highlight toggle
        highlightToggle.checked = config.highlightEnabled;

        // Apply font family
        fontFamilySelect.value = config.fontFamily;
        applyFontFamily(config.fontFamily);

        // Apply font size
        fontSizeInput.value = config.fontSize;
        fontSizeValue.textContent = config.fontSize;
        applyFontSize(config.fontSize);
    }

    function resetToDefaults() {
        try {
            localStorage.removeItem(CONFIG_KEY);
        } catch (e) {
            console.warn('Failed to clear config:', e);
        }

        // Reset UI to defaults
        highlightToggle.checked = DEFAULT_CONFIG.highlightEnabled;
        fontFamilySelect.value = DEFAULT_CONFIG.fontFamily;
        fontSizeInput.value = DEFAULT_CONFIG.fontSize;
        fontSizeValue.textContent = DEFAULT_CONFIG.fontSize;

        // Apply defaults
        applyFontFamily(DEFAULT_CONFIG.fontFamily);
        applyFontSize(DEFAULT_CONFIG.fontSize);

        // Refresh display
        updateFilter();

        showToast('Display settings reset to defaults');
    }

    function applyFontFamily(fontFamily) {
        // Remove all font classes
        outputEl.classList.remove('font-jetbrains', 'font-fira', 'font-consolas', 'font-menlo');

        // Add appropriate class
        if (fontFamily === 'jetbrains') {
            outputEl.classList.add('font-jetbrains');
        } else if (fontFamily === 'fira') {
            outputEl.classList.add('font-fira');
        } else if (fontFamily === 'consolas') {
            outputEl.classList.add('font-consolas');
        } else if (fontFamily === 'menlo') {
            outputEl.classList.add('font-menlo');
        }
        // 'system' uses default, no class needed
    }

    function applyFontSize(size) {
        outputEl.style.fontSize = size + 'px';
    }

    // --- Syntax Highlighting ---
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function highlightLine(line) {
        if (!highlightToggle.checked) {
            return escapeHtml(line);
        }

        let highlighted = escapeHtml(line);

        // Highlight timestamp at the start of line
        const timestampMatch = line.match(TIMESTAMP_PATTERN);
        if (timestampMatch) {
            const escapedTimestamp = escapeHtml(timestampMatch[0]);
            highlighted = highlighted.replace(escapedTimestamp, `<span class="log-timestamp">${escapedTimestamp}</span>`);
        }

        // Highlight error keywords (check first - highest priority)
        HIGHLIGHT_PATTERNS.error.forEach(keyword => {
            if (line.includes(keyword)) {
                const escapedKeyword = escapeHtml(keyword);
                const regex = new RegExp(escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                highlighted = highlighted.replace(regex, `<span class="log-error">${escapedKeyword}</span>`);
            }
        });

        // Highlight debug keywords
        HIGHLIGHT_PATTERNS.debug.forEach(keyword => {
            if (line.includes(keyword)) {
                const escapedKeyword = escapeHtml(keyword);
                const regex = new RegExp(escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                highlighted = highlighted.replace(regex, `<span class="log-debug">${escapedKeyword}</span>`);
            }
        });

        // Highlight flow/execution keywords
        HIGHLIGHT_PATTERNS.flow.forEach(keyword => {
            if (line.includes(keyword)) {
                const escapedKeyword = escapeHtml(keyword);
                const regex = new RegExp(escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                highlighted = highlighted.replace(regex, `<span class="log-flow">${escapedKeyword}</span>`);
            }
        });

        // Highlight limit keywords
        HIGHLIGHT_PATTERNS.limit.forEach(keyword => {
            if (line.includes(keyword)) {
                const escapedKeyword = escapeHtml(keyword);
                const regex = new RegExp(escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                highlighted = highlighted.replace(regex, `<span class="log-limit">${escapedKeyword}</span>`);
            }
        });

        return highlighted;
    }

    function renderOutput(lines) {
        if (lines.length === 0) {
            outputEl.innerHTML = '';
            rawFilteredText = '';
            return;
        }

        // Store raw text for copy operations
        rawFilteredText = lines.join('\n');

        // Build HTML with highlighting
        const html = lines.map(line => {
            const highlighted = highlightLine(line);
            return `<span class="log-line">${highlighted}</span>`;
        }).join('');

        outputEl.innerHTML = html;
    }

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (inputEl.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            inputEl.value = window.SampleData.apexDebugLog;

            // Check default filters plus maybe SOQL
            document.getElementById('filterSoql').checked = true;
            customFilterEl.value = '';

            updateFilter();
        });
    }

    // File Upload Logic
    uploadBtn.addEventListener('click', () => {
        logFileInput.click();
    });

    logFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Verify file extension/type
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.log') && !fileName.endsWith('.txt') && file.type !== 'text/plain') {
            alert('Please upload a valid .log or .txt file.');
            return;
        }

        originalFileName = file.name;

        // Limit file size (e.g., 50MB) to prevent browser crashing
        const MAX_SIZE_MB = 50;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`File is too large. Please upload a file smaller than ${MAX_SIZE_MB}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            inputEl.value = e.target.result;
            updateFilter();
        };
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };
        reader.readAsText(file);

        // Reset file input so the same file can be uploaded again if needed
        event.target.value = '';
    });

    function updateFilter() {
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        inputStatsEl.textContent = `${lines.length} lines`;

        if (!rawInput.trim()) {
            renderOutput([]);
            outputStatsEl.textContent = '0 lines shown';
            originalFileName = '';
            return;
        }

        // Gather selected filters
        const activeFilters = Array.from(filterCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const customText = customFilterEl.value.toLowerCase().trim();

        const filteredLines = lines.filter(line => {
            // Include empty lines if input is just empty? No, skip them.
            if (!line.trim()) return false;

            // Check against active checkboxes (OR logic among checkboxes)
            let matchesCheckbox = activeFilters.some(filter => line.includes(`|${filter}|`) || line.includes(`|${filter}`));

            // If no checkboxes are selected, assume false unless custom filter applies
            if (activeFilters.length === 0) {
                 matchesCheckbox = false;
            }

            // Check custom text (AND logic with checkbox match if checkboxes are checked, otherwise just check custom)
            let matchesCustom = true;
            if (customText) {
                matchesCustom = line.toLowerCase().includes(customText);
            }

            // If no active filters, and no custom text, don't show anything.
            if (activeFilters.length === 0 && !customText) {
                return false;
            }

            if (activeFilters.length > 0 && customText) {
                 return matchesCheckbox && matchesCustom;
            } else if (activeFilters.length > 0) {
                 return matchesCheckbox;
            } else if (customText) {
                 return matchesCustom;
            }

            return false;
        });

        renderOutput(filteredLines);
        outputStatsEl.textContent = `${filteredLines.length} lines shown`;

        // Disable save button if no output
        if (saveBtn) {
            saveBtn.disabled = filteredLines.length === 0;
        }
    }

    // --- Save Logic ---
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!rawFilteredText) return;

            let downloadName = 'filtered_debug_log.log';
            if (originalFileName) {
                const lastDotIndex = originalFileName.lastIndexOf('.');
                if (lastDotIndex !== -1 && lastDotIndex !== 0) {
                    const namePart = originalFileName.substring(0, lastDotIndex);
                    const extPart = originalFileName.substring(lastDotIndex);
                    downloadName = `${namePart}_filtered${extPart}`;
                } else {
                    downloadName = `${originalFileName}_filtered.log`;
                }
            }

            downloadFile(rawFilteredText, downloadName);
        });
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (!rawFilteredText) return;

        copyToClipboard(rawFilteredText, 'Log copied to clipboard!');
    });

    // Initialize configuration on page load
    applyConfig();
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

function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
