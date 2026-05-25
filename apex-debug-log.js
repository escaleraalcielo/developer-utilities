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
        apex: ['CODE_UNIT_STARTED', 'CODE_UNIT_FINISHED', 'CONSTRUCTOR_ENTRY', 'CONSTRUCTOR_EXIT', 'METHOD_ENTRY', 'METHOD_EXIT', 'EXECUTION_STARTED', 'EXECUTION_FINISHED', 'BULK_HEAP_ALLOCATE', 'ENTERING_MANAGED_PKG', 'EMAIL_QUEUE', 'HEAP_ALLOCATE', 'HEAP_DEALLOCATE'],
        debug: ['USER_DEBUG', 'SYSTEM_DEBUG'],
        limit: ['LIMIT_USAGE_FOR_NS', 'CUMULATIVE_LIMIT_USAGE', 'CUMULATIVE_LIMIT_USAGE_END', 'CUMULATIVE_PROFILING', 'CUMULATIVE_PROFILING_BEGIN', 'CUMULATIVE_PROFILING_END'],
        database: ['DML_BEGIN', 'DML_END', 'SOQL_EXECUTE_BEGIN', 'SOQL_EXECUTE_END', 'SOSL_EXECUTE_BEGIN', 'SOSL_EXECUTE_END', 'IDEAS_QUERY_EXECUTE'],
        callout: ['CALLOUT_REQUEST', 'CALLOUT_RESPONSE', 'NAMED_CREDENTIAL_REQUEST', 'NAMED_CREDENTIAL_RESPONSE', 'NAMED_CREDENTIAL_RESPONSE_DETAIL'],
        workflow: ['FLOW_ACTIONCALL_DETAIL', 'FLOW_ASSIGNMENT_DETAIL', 'FLOW_BULK_ELEMENT_BEGIN', 'FLOW_BULK_ELEMENT_DETAIL', 'FLOW_BULK_ELEMENT_END', 'FLOW_BULK_ELEMENT_LIMIT_USAGE', 'FLOW_BULK_ELEMENT_NOT_SUPPORTED', 'FLOW_CREATE_INTERVIEW_BEGIN', 'FLOW_CREATE_INTERVIEW_END', 'FLOW_CREATE_INTERVIEW_ERROR', 'FLOW_ELEMENT_BEGIN', 'FLOW_ELEMENT_DEFERRED', 'FLOW_ELEMENT_END', 'FLOW_ELEMENT_ERROR', 'FLOW_ELEMENT_FAULT', 'FLOW_ELEMENT_LIMIT_USAGE', 'FLOW_INTERVIEW_FINISHED_LIMIT_USAGE', 'FLOW_INTERVIEW_PAUSED', 'FLOW_INTERVIEW_RESUMED', 'FLOW_LOOP_DETAIL', 'FLOW_RULE_DETAIL', 'FLOW_START_INTERVIEW_BEGIN', 'FLOW_START_INTERVIEW_END', 'FLOW_START_INTERVIEWS_BEGIN', 'FLOW_START_INTERVIEWS_END', 'FLOW_START_INTERVIEWS_ERROR', 'FLOW_START_INTERVIEW_LIMIT_USAGE', 'FLOW_START_SCHEDULED_RECORDS', 'FLOW_SUBFLOW_DETAIL', 'FLOW_VALUE_ASSIGNMENT', 'FLOW_WAIT_EVENT_RESUMING_DETAIL', 'FLOW_WAIT_EVENT_WAITING_DETAIL', 'FLOW_WAIT_RESUMING_DETAIL', 'FLOW_WAIT_WAITING_DETAIL'],
        event: ['EVENT_SERVICE_PUB_BEGIN', 'EVENT_SERVICE_PUB_DETAIL', 'EVENT_SERVICE_PUB_END', 'EVENT_SERVICE_SUB_BEGIN', 'EVENT_SERVICE_SUB_DETAIL', 'EVENT_SERVICE_SUB_END'],
        cursor: ['CURSOR_CREATE_BEGIN', 'CURSOR_CREATE_END', 'CURSOR_FETCH', 'CURSOR_FETCH_PAGE'],
        profiling: ['LIMIT_USAGE_FOR_NS', 'CUMULATIVE_LIMIT_USAGE', 'CUMULATIVE_LIMIT_USAGE_END', 'CUMULATIVE_PROFILING', 'CUMULATIVE_PROFILING_BEGIN', 'CUMULATIVE_PROFILING_END'],
        dataAccess: ['DATA_ACCESS_EVALUATION'],
        nba: ['NBA_NODE_BEGIN', 'NBA_NODE_DETAIL', 'NBA_NODE_END', 'NBA_NODE_ERROR', 'NBA_OFFER_INVALID'],
        variable: ['VARIABLE_SCOPE_BEGIN', 'VARIABLE_SCOPE_END'],
        statement: ['STATEMENT_EXECUTE']
    };

    // Timestamp pattern: HH:MM:SS.NNN (NNNNNNN)
    const TIMESTAMP_PATTERN = /^\d{2}:\d{2}:\d{2}\.\d{3}\s*\(\d+\)/;

    // Master Regex for Syntax Highlighting
    const allKeywords = [];
    const keywordMap = new Map();
    const categoriesOrder = ['error', 'debug', 'apex', 'database', 'callout', 'workflow', 'event', 'cursor', 'profiling', 'dataAccess', 'nba', 'variable', 'statement', 'limit'];

    for (const type of categoriesOrder) {
        if (HIGHLIGHT_PATTERNS[type]) {
            for (const kw of HIGHLIGHT_PATTERNS[type]) {
                if (!keywordMap.has(kw)) {
                    allKeywords.push(kw);
                    keywordMap.set(kw, type);
                }
            }
        }
    }

    const escapedKeywords = allKeywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const masterRegexStr = '(^\\d{2}:\\d{2}:\\d{2}\\.\\d{3}\\s*\\(\\d+\\)\\|?)|(' + escapedKeywords.join('|') + ')';
    const MASTER_HIGHLIGHT_REGEX = new RegExp(masterRegexStr, 'g');

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
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function highlightLine(line) {
        const fragment = document.createDocumentFragment();

        if (!highlightToggle.checked) {
            fragment.appendChild(document.createTextNode(line));
            return fragment;
        }

        MASTER_HIGHLIGHT_REGEX.lastIndex = 0;
        let lastIndex = 0;
        let match;

        while ((match = MASTER_HIGHLIGHT_REGEX.exec(line)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(line.substring(lastIndex, match.index)));
            }

            const matchedText = match[0];
            let className = '';

            if (match[1]) {
                className = 'log-timestamp';
            } else {
                const kw = match[2];
                const type = keywordMap.get(kw);
                if (type === 'dataAccess') className = 'log-data-access';
                else className = 'log-' + type;
            }

            const span = document.createElement('span');
            span.className = className;
            span.textContent = matchedText;
            fragment.appendChild(span);

            lastIndex = MASTER_HIGHLIGHT_REGEX.lastIndex;

            if (match[0].length === 0) {
                MASTER_HIGHLIGHT_REGEX.lastIndex++;
                lastIndex++;
            }
        }

        if (lastIndex < line.length) {
            fragment.appendChild(document.createTextNode(line.substring(lastIndex)));
        }

        return fragment;
    }

    function renderOutput(lines) {
        if (lines.length === 0) {
            outputEl.textContent = '';
            rawFilteredText = '';
            return;
        }

        // Store raw text for copy operations
        rawFilteredText = lines.join('\n');

        // Build HTML with highlighting safely
        const fragment = document.createDocumentFragment();

        lines.forEach(line => {
            const span = document.createElement('span');
            span.className = 'log-line';
            span.appendChild(highlightLine(line));
            fragment.appendChild(span);
        });

        outputEl.textContent = '';
        outputEl.appendChild(fragment);
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

function fallbackCopyTextToClipboard(text, successMessage) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'copyFallbackOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create container
    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    // Instruction text
    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = `
        margin: 0 0 16px 0;
        color: #333;
        font-size: 14px;
        text-align: center;
    `;

    // Textarea with content
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
        width: 100%;
        min-height: 150px;
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

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        background: #0d6efd;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        display: block;
        margin: 0 auto;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#0b5ed7';
    closeBtn.onmouseout = () => closeBtn.style.background = '#0d6efd';

    // Close function
    const closeOverlay = () => {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
    };

    closeBtn.addEventListener('click', closeOverlay);

    // Close on overlay click (outside container)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeOverlay();
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Assemble and show
    container.appendChild(instruction);
    container.appendChild(textarea);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Auto-focus and select
    textarea.focus();
    textarea.select();
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
