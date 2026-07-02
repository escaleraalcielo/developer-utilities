document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const inputA = document.getElementById('inputA');
    const inputB = document.getElementById('inputB');
    const optSmartSF = document.getElementById('optSmartSF');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const optCaseSensitive = document.getElementById('optCaseSensitive');
    const optRemoveDupes = document.getElementById('optRemoveDupes');
    const optTrim = document.getElementById('optTrim');
    const optRemoveEmpty = document.getElementById('optRemoveEmpty');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // Stats
    const countA = document.getElementById('countA');
    const countB = document.getElementById('countB');
    const countOnlyA = document.getElementById('countOnlyA');
    const countOnlyB = document.getElementById('countOnlyB');
    const countCommon = document.getElementById('countCommon');

    // Output Containers
    const resOnlyA = document.getElementById('resOnlyA');
    const resOnlyB = document.getElementById('resOnlyB');
    const resCommon = document.getElementById('resCommon');

    // History
    const history = new HistoryManager({
        getType: () => 'List Diff',
        getPreview: (item) => item.preview || ''
    });

    // State
    let resultSets = {
        onlyA: [],
        onlyB: [],
        common: []
    };

    // Events
    const inputs = [inputA, inputB, optSmartSF, optCaseSensitive, optRemoveDupes, optTrim, optRemoveEmpty, document.getElementById('optSort')];
    inputs.forEach(el => el.addEventListener('input', updateDiff));

    clearAllBtn.addEventListener('click', () => {
        inputA.value = '';
        inputB.value = '';
        updateDiff();
    });

    // --- Load Sample Logic ---
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (inputA.value.trim() !== '' || inputB.value.trim() !== '') {
                const proceed = window.confirm("This will overwrite your current input. Do you want to continue?");
                if (!proceed) return;
            }

            // Sample data demonstrating 15 vs 18 char SF IDs, common elements, and unique elements
            inputA.value = window.SampleData.listDiff.listA;
            inputB.value = window.SampleData.listDiff.listB;

            optSmartSF.checked = true;
            optRemoveDupes.checked = true;
            updateDiff();
        });
    }

    // Initial Run
    updateDiff();

    function updateDiff() {
        // 1. Get Options
        const isSmartSF = optSmartSF.checked;
        const isCaseSensitive = optCaseSensitive.checked;
        const shouldRemoveDupes = optRemoveDupes.checked;
        const shouldTrim = optTrim.checked;
        const shouldRemoveEmpty = optRemoveEmpty.checked;
        const sortMode = document.getElementById('optSort').value;

        // 2. Process Inputs
        const listA = parseInput(inputA.value, shouldTrim, shouldRemoveEmpty);
        const listB = parseInput(inputB.value, shouldTrim, shouldRemoveEmpty);

        countA.innerText = listA.length;
        countB.innerText = listB.length;

        // 3. Comparison Logic
        // We need to map transformed values (for comparison) back to original values (for display)
        // Strategy: Create a map of "ComparisonKey" -> "OriginalValue" (or list of originals if duplicates allowed)

        const mapA = buildMap(listA, isSmartSF, isCaseSensitive);
        const mapB = buildMap(listB, isSmartSF, isCaseSensitive);

        const keysA = new Set(mapA.keys());
        const keysB = new Set(mapB.keys());

        // Calculate Sets
        const onlyAKeys = [...keysA].filter(k => !keysB.has(k));
        const onlyBKeys = [...keysB].filter(k => !keysA.has(k));
        const commonKeys = [...keysA].filter(k => keysB.has(k));

        // Retrieve Original Values
        // If duplicates are NOT removed, we might technically have multiple originals for a key.
        // For this tool, "Remove Duplicates" usually means remove duplicates *within* the list.
        // If "Remove Duplicates" is OFF, effectively we just show all occurrences. 
        // But for "Difference" logic, set theory implies unique elements. 
        // Standard "Diff" tools usually work on Sets.
        // IF Remove Duplicates is FALSE: We should probably show all instances from A that aren't in B?
        // That gets complex (bag diff). 
        // SIMPLIFICATION: If Remove Duplicates is OFF, we show all instances.

        resultSets.onlyA = recoverValues(onlyAKeys, mapA, shouldRemoveDupes, sortMode);
        resultSets.onlyB = recoverValues(onlyBKeys, mapB, shouldRemoveDupes, sortMode);
        // For common, usually we show the value from A (or B). Let's pick A.
        resultSets.common = recoverValues(commonKeys, mapA, shouldRemoveDupes, sortMode);

        // 4. Render
        renderList(resOnlyA, resultSets.onlyA, countOnlyA);
        renderList(resOnlyB, resultSets.onlyB, countOnlyB);
        renderList(resCommon, resultSets.common, countCommon);
    }

    function parseInput(text, shouldTrim, shouldRemoveEmpty) {
        if (!text) return [];
        // Split by newline
        let lines = text.split(/\r?\n/);

        if (shouldTrim) {
            lines = lines.map(line => line.trim());
        }

        if (shouldRemoveEmpty) {
            lines = lines.filter(line => line !== '');
        }

        return lines;
    }

    function buildMap(list, isSmartSF, isCaseSensitive) {
        const map = new Map();

        list.forEach(item => {
            let key = item;

            // 1. Smart SF Logic
            if (isSmartSF && isSalesforceId(item)) {
                key = to18CharId(item); // Always normalize to 18 for key
            } else {
                // 2. Case Insensitive (Only if NOT SF ID - SF IDs are case sensitive in 15 char, but 18 is case-safe. 
                // Actually, 15 char is Case Sensitive. 18 char is Case Safe (unique).
                // If we convert to 18, we have a unique string.
                // If it's NOT an SF ID:
                if (!isCaseSensitive) {
                    key = key.toLowerCase();
                }
            }

            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(item);
        });

        return map;
    }

    function recoverValues(keys, map, shouldRemoveDupes, sortMode) {
        let result = [];

        // Sorting logic
        if (sortMode === 'AAA') {
            keys.sort(); // A-Z
        } else if (sortMode === 'ZZZ') {
            keys.sort().reverse(); // Z-A
        }
        // If 'OFF', do not sort (preserves original/insertion order)

        keys.forEach(key => {
            const originals = map.get(key);
            if (shouldRemoveDupes) {
                // Just take the first one seen
                result.push(originals[0]);
            } else {
                // Take all
                result.push(...originals);
            }
        });
        return result;
    }

    function renderList(container, items, countEl) {
        container.innerHTML = '';
        countEl.innerText = items.length;

        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';

            // Visualize Spaces
            // Replace leading/trailing spaces with specific HTML/Span to highlight them

            // We want to detect leading/trailing spaces and render them subtly visible
            // Regex to find leading spaces: ^\s+
            // Regex to find trailing spaces: \s+$

            // We can treat the string as 3 parts: Leading, Body, Trailing
            // Or just check spaces.

            // Simple visualizer: Replace space chars with a span containing a dot?
            // Or just use the 'invisible-space' class for the space chars.

            const content = escapeHtml(item).replace(/ /g, '<span class="invisible-space">·</span>');

            div.innerHTML = content || '<span class="text-muted fst-italic">&lt;empty&gt;</span>';
            fragment.appendChild(div);
        });

        container.appendChild(fragment);
    }

    // --- Helpers ---

    function isSalesforceId(str) {
        // Basic check: 15 or 18 chars, alphanumeric
        return /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(str);
    }

    function to18CharId(id) {
        if (id.length === 18) return id;
        if (id.length !== 15) return id; // Should not happen if check passed, but safety

        let suffix = '';
        for (let i = 0; i < 3; i++) {
            let flags = 0;
            for (let j = 0; j < 5; j++) {
                const char = id.charAt(i * 5 + j);
                if (char >= 'A' && char <= 'Z') {
                    flags += (1 << j);
                }
            }
            suffix += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'.charAt(flags);
        }
        return id + suffix;
    }

    // --- Clipboard ---

    window.copyResult = (type) => {
        let items = resultSets[type] || [];
        if (items.length === 0) return;

        const text = items.join('\n');

        const typeLabel = type === 'onlyA' ? 'Only in A' : type === 'onlyB' ? 'Only in B' : 'Common';
        history.add({
            value: text,
            preview: `${typeLabel} (${items.length}): ${text.substring(0, 100)}`
        });

        copyToClipboard(text, 'List copied to clipboard!');
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

function fallbackCopyTextToClipboard(text, successMessage) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const instruction = document.createElement('p');
    instruction.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then close this dialog';
    instruction.style.cssText = `
        margin: 0 0 16px 0;
        color: #333;
        font-size: 14px;
        font-weight: 500;
    `;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
        width: 100%;
        min-height: 120px;
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

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        background: #0d6efd;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        float: right;
    `;

    container.appendChild(instruction);
    container.appendChild(textarea);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    textarea.focus();
    textarea.select();

    const closeModal = () => {
        document.body.removeChild(overlay);
        showToast(successMessage);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', escHandler);
            closeModal();
        }
    });
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
