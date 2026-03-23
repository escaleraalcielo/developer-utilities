document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const inputText = document.getElementById('inputText');
    const outputEl = document.getElementById('output');
    const outputStatsEl = document.getElementById('outputStats');
    const validationMessageEl = document.getElementById('validationMessage');
    const validationTextEl = document.getElementById('validationText');
    const charCountEl = document.getElementById('charCount');

    // Buttons
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    // Toggles
    const modeEncodeRx = document.getElementById('modeEncode');
    const modeDecodeRx = document.getElementById('modeDecode');
    const fileTabBtn = document.getElementById('file-tab');
    const textTabBtn = document.getElementById('text-tab');

    // History
    const historyTableBody = document.getElementById('historyTableBody');
    const historyCountEl = document.getElementById('historyCount');
    let sessionHistory = [];
    const HISTORY_LIMIT = 10;

    // Constants
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const MAX_TEXT_CHARS = 5000;

    // --- State ---
    let currentMode = 'file'; // 'file' or 'text'
    let textConversionMode = 'encode'; // 'encode' or 'decode'

    // --- Event Listeners ---

    // Tab Switching
    fileTabBtn.addEventListener('shown.bs.tab', () => {
        currentMode = 'file';
        resetUI();
    });

    textTabBtn.addEventListener('shown.bs.tab', () => {
        currentMode = 'text';
        resetUI();
        inputText.focus();
    });

    // Text Mode Toggle
    modeEncodeRx.addEventListener('change', () => {
        if (modeEncodeRx.checked) {
            textConversionMode = 'encode';
            processText();
        }
    });

    modeDecodeRx.addEventListener('change', () => {
        if (modeDecodeRx.checked) {
            textConversionMode = 'decode';
            processText();
        }
    });

    // File Input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('active');
    }

    function unhighlight(e) {
        dropZone.classList.remove('active');
    }

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Text Input
    inputText.addEventListener('input', processText);


    // Copy & Clear
    copyBtn.addEventListener('click', () => {
        const content = outputEl.value;
        if (!content) return;

        // If Text mode, save to history now
        if (currentMode === 'text') {
            const label = textConversionMode === 'encode' ? 'Encoded Text' : 'Decoded Text';
            addToHistory('Text', label, content);
        }

        outputEl.select();
        navigator.clipboard.writeText(content).then(() => {
            showToast();
        });
    });

    clearBtn.addEventListener('click', resetUI);


    // --- Core Logic ---

    function resetUI() {
        outputEl.value = "";
        fileInput.value = "";
        inputText.value = "";
        outputStatsEl.textContent = "No input";
        validationMessageEl.classList.add('d-none');
        copyBtn.disabled = true;
        charCountEl.textContent = `0/${MAX_TEXT_CHARS}`;

        // Remove validation styles
        inputText.classList.remove('border-warning');
    }

    function showError(msg) {
        validationTextEl.textContent = msg;
        validationMessageEl.classList.remove('d-none');
        outputStatsEl.textContent = "Error";
        copyBtn.disabled = true;
    }

    function clearError() {
        validationMessageEl.classList.add('d-none');
        inputText.classList.remove('border-warning');
    }

    // File Processing
    function handleFile(file) {
        clearError();
        outputEl.value = "";
        outputStatsEl.textContent = "Processing...";

        if (!file) return;

        // Validation based on Size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            showError(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const result = e.target.result;
            // Strip the data URL prefix (e.g., "data:image/png;base64,")
            const base64Content = result.split(',')[1] || result;

            outputEl.value = base64Content;

            const sizeStr = formatBytes(file.size);
            outputStatsEl.textContent = `${file.name} (${sizeStr})`;
            copyBtn.disabled = false;

            // Auto-save to history
            addToHistory('File', file.name, base64Content);
        };

        reader.onerror = () => {
            showError("Error reading file.");
        };

        reader.readAsDataURL(file);
    }

    // Text Processing
    function processText() {
        const text = inputText.value;
        const len = text.length;

        charCountEl.textContent = `${len}/${MAX_TEXT_CHARS}`;

        if (len === 0) {
            outputEl.value = "";
            outputStatsEl.textContent = "No input";
            clearError();
            return;
        }

        if (len > MAX_TEXT_CHARS) {
            showError(`Input exceeds ${MAX_TEXT_CHARS} characters.`);
            inputText.classList.add('border-warning');
            outputEl.value = "";
            return;
        }

        clearError();

        try {
            let result = "";
            let description = "";

            if (textConversionMode === 'encode') {
                // Encode: Text -> Base64
                // Use TextEncoder to handle UTF-8 correctly before btoa
                // btoa only accepts binary strings (Latin1), so we convert UTF-8 bytes to Latin1 string
                const bytes = new TextEncoder().encode(text);
                const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
                result = btoa(binString);
                description = `Encoded ${len} chars`;
            } else {
                // Decode: Base64 -> Text
                // atob -> binary string -> Uint8Array -> TextDecoder
                const binString = atob(text);
                const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
                result = new TextDecoder().decode(bytes);
                description = `Decoded ${len} chars`;
            }

            outputEl.value = result;
            outputStatsEl.textContent = "Success";
            copyBtn.disabled = false;

        } catch (e) {
            if (textConversionMode === 'decode') {
                // Common error for invalid base64
                outputEl.value = "";
                showError("Invalid Base64 string.");
                outputStatsEl.textContent = "Invalid Input";
            } else {
                console.error(e);
                showError("Conversion error.");
            }
        }
    }

    // --- History Logic ---

    // Expose globally for inline onclicks
    window.copyFromHistory = (id) => {
        const item = sessionHistory.find(i => i.id === id);
        if (item) {
            navigator.clipboard.writeText(item.fullResult).then(() => {
                showToast();
            });
        }
    };

    window.deleteFromHistory = (id) => {
        sessionHistory = sessionHistory.filter(i => i.id !== id);
        renderHistory();
    };

    function addToHistory(type, label, content) {
        // Prevent duplicates at the top
        if (sessionHistory.length > 0 && sessionHistory[0].fullResult === content) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        let preview = content.substring(0, 60) + (content.length > 60 ? '...' : '');

        const newItem = {
            id: Date.now(),
            timestamp,
            type,       // 'File', 'Text Encode', 'Text Decode'
            label,      // Filename or 'Text'
            preview,
            fullResult: content
        };

        sessionHistory.unshift(newItem);
        if (sessionHistory.length > HISTORY_LIMIT) {
            sessionHistory.pop();
        }

        renderHistory();
    }

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
                <td class="align-middle text-info"><small>${item.type}</small></td>
                <td class="align-middle text-break font-monospace" style="font-size: 0.85em;">
                    ${escapeHtml(item.preview)}
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

    // Helpers
    function showToast() {
        const toastEl = document.getElementById('copyToast');
        if (toastEl && typeof bootstrap !== 'undefined') {
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
