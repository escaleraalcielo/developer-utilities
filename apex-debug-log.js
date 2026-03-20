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

    // Filters
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const customFilterEl = document.getElementById('customFilter');

    // Event Listeners
    inputEl.addEventListener('input', updateFilter);
    customFilterEl.addEventListener('input', updateFilter);
    filterCheckboxes.forEach(cb => cb.addEventListener('change', updateFilter));

    // Global func for clear button
    window.updateFilter = updateFilter;

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
            outputEl.value = '';
            outputStatsEl.textContent = '0 lines shown';
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

        outputEl.value = filteredLines.join('\n');
        outputStatsEl.textContent = `${filteredLines.length} lines shown`;

        // Disable save button if no output
        if (saveBtn) {
            saveBtn.disabled = filteredLines.length === 0;
        }
    }

    // --- Save Logic ---
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!outputEl.value) return;

            const blob = new Blob([outputEl.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'filtered_debug_log.log';
            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        outputEl.select();
        navigator.clipboard.writeText(outputEl.value).then(() => {
            const toastEl = document.getElementById('copyToast');
            if (toastEl && typeof bootstrap !== 'undefined') {
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        });
    });
});