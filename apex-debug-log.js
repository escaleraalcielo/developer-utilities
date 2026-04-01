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

    // Pagination Elements
    const inputPagination = document.getElementById('inputPagination');
    const loadMoreInputBtn = document.getElementById('loadMoreInputBtn');
    const loadAllInputBtn = document.getElementById('loadAllInputBtn');

    const outputPagination = document.getElementById('outputPagination');
    const loadMoreOutputBtn = document.getElementById('loadMoreOutputBtn');
    const loadAllOutputBtn = document.getElementById('loadAllOutputBtn');

    // State Variables
    let originalFileName = '';
    let rawLines = [];
    let filteredLines = [];

    const INITIAL_LIMIT = 20000;
    const CHUNK_SIZE = 100000;

    let inputDisplayLimit = INITIAL_LIMIT;
    let outputDisplayLimit = INITIAL_LIMIT;

    // Event Listeners
    inputEl.addEventListener('input', (e) => {
        // If the textarea is readonly (truncated), we shouldn't update rawLines from it.
        // If it's not readonly, update rawLines without calling renderInput() to avoid cursor jumping.
        if (!inputEl.readOnly) {
            rawLines = e.target.value.split(/\r?\n/);
            // Do not call renderInput() here, as it resets the user's cursor position.
            updateFilter();
        }
    });
    customFilterEl.addEventListener('input', updateFilter);
    filterCheckboxes.forEach(cb => cb.addEventListener('change', updateFilter));

    // Pagination Listeners
    loadMoreInputBtn.addEventListener('click', () => {
        inputDisplayLimit += CHUNK_SIZE;
        renderInput();
    });

    loadAllInputBtn.addEventListener('click', () => {
        inputDisplayLimit = rawLines.length;
        renderInput();
    });

    loadMoreOutputBtn.addEventListener('click', () => {
        outputDisplayLimit += CHUNK_SIZE;
        renderOutput();
    });

    loadAllOutputBtn.addEventListener('click', () => {
        outputDisplayLimit = filteredLines.length;
        renderOutput();
    });

    // Global func for clear button
    window.updateFilter = () => {
        if (!inputEl.value) {
            rawLines = [];
        }
        inputDisplayLimit = INITIAL_LIMIT;
        outputDisplayLimit = INITIAL_LIMIT;
        renderInput();
        updateFilter();
    };

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            const hasContent = rawLines.length > 0 && !(rawLines.length === 1 && rawLines[0].trim() === '');
            if (hasContent) {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            rawLines = window.SampleData.apexDebugLog.split(/\r?\n/);
            inputDisplayLimit = INITIAL_LIMIT;

            // Check default filters plus maybe SOQL
            document.getElementById('filterSoql').checked = true;
            customFilterEl.value = '';

            renderInput();
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
            rawLines = e.target.result.split(/\r?\n/);
            inputDisplayLimit = INITIAL_LIMIT;
            renderInput();
            updateFilter();
        };
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };
        reader.readAsText(file);

        // Reset file input so the same file can be uploaded again if needed
        event.target.value = '';
    });

    function renderInput() {
        if (rawLines.length === 0) {
            inputEl.value = '';
            inputEl.readOnly = false;
            inputStatsEl.textContent = '0 lines';
            inputPagination.classList.remove('d-flex');
            inputPagination.classList.add('d-none');
            return;
        }

        const linesToShow = Math.min(rawLines.length, inputDisplayLimit);
        inputEl.value = rawLines.slice(0, linesToShow).join('\n');

        const remainingLines = rawLines.length - linesToShow;
        if (remainingLines > 0) {
            // Make readonly when truncated to prevent data loss on edit
            inputEl.readOnly = true;
            inputStatsEl.textContent = `Showing ${linesToShow.toLocaleString()} of ${rawLines.length.toLocaleString()} lines (Truncated for performance - Read Only)`;
            inputPagination.classList.remove('d-none');
            inputPagination.classList.add('d-flex');

            const nextChunk = Math.min(CHUNK_SIZE, remainingLines);
            loadMoreInputBtn.textContent = `Load ${nextChunk.toLocaleString()} more`;
            loadAllInputBtn.textContent = `Load remaining ${remainingLines.toLocaleString()}`;
        } else {
            // Restore editability when fully loaded
            inputEl.readOnly = false;
            inputStatsEl.textContent = `${rawLines.length.toLocaleString()} lines`;
            inputPagination.classList.remove('d-flex');
            inputPagination.classList.add('d-none');
        }
    }

    function renderOutput() {
        if (filteredLines.length === 0) {
            outputEl.value = '';
            outputStatsEl.textContent = '0 lines shown';
            outputPagination.classList.remove('d-flex');
            outputPagination.classList.add('d-none');
            return;
        }

        const linesToShow = Math.min(filteredLines.length, outputDisplayLimit);
        outputEl.value = filteredLines.slice(0, linesToShow).join('\n');

        const remainingLines = filteredLines.length - linesToShow;
        if (remainingLines > 0) {
            outputStatsEl.textContent = `Showing ${linesToShow.toLocaleString()} of ${filteredLines.length.toLocaleString()} filtered lines (Truncated for performance)`;
            outputPagination.classList.remove('d-none');
            outputPagination.classList.add('d-flex');

            const nextChunk = Math.min(CHUNK_SIZE, remainingLines);
            loadMoreOutputBtn.textContent = `Load ${nextChunk.toLocaleString()} more`;
            loadAllOutputBtn.textContent = `Load remaining ${remainingLines.toLocaleString()}`;
        } else {
            outputStatsEl.textContent = `${filteredLines.length.toLocaleString()} lines shown`;
            outputPagination.classList.remove('d-flex');
            outputPagination.classList.add('d-none');
        }
    }

    function updateFilter() {
        const isEmpty = rawLines.length === 0 || (rawLines.length === 1 && rawLines[0].trim() === '');
        if (isEmpty) {
            filteredLines = [];
            renderOutput();
            originalFileName = '';
            return;
        }

        // Gather selected filters
        const activeFilters = Array.from(filterCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const customText = customFilterEl.value.toLowerCase().trim();

        filteredLines = rawLines.filter(line => {
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

        outputDisplayLimit = INITIAL_LIMIT;
        renderOutput();

        // Disable save button if no output
        if (saveBtn) {
            saveBtn.disabled = filteredLines.length === 0;
        }
    }

    // --- Save Logic ---
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (filteredLines.length === 0) return;

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

            downloadFile(filteredLines.join('\n'), downloadName);
        });
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (filteredLines.length === 0) return;

        outputEl.select();
        copyToClipboard(filteredLines.join('\n'), 'Log copied to clipboard!');
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
