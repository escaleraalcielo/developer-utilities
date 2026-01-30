document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const inputA = document.getElementById('inputA');
    const inputB = document.getElementById('inputB');
    const optSmartSF = document.getElementById('optSmartSF');
    const optCaseSensitive = document.getElementById('optCaseSensitive');
    const optRemoveDupes = document.getElementById('optRemoveDupes');
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

    // State
    let resultSets = {
        onlyA: [],
        onlyB: [],
        common: []
    };

    // Events
    const inputs = [inputA, inputB, optSmartSF, optCaseSensitive, optRemoveDupes];
    inputs.forEach(el => el.addEventListener('input', updateDiff));

    clearAllBtn.addEventListener('click', () => {
        inputA.value = '';
        inputB.value = '';
        updateDiff();
    });

    // Initial Run
    updateDiff();

    function updateDiff() {
        // 1. Get Options
        const isSmartSF = optSmartSF.checked;
        const isCaseSensitive = optCaseSensitive.checked;
        const shouldRemoveDupes = optRemoveDupes.checked;

        // 2. Process Inputs
        const listA = parseInput(inputA.value);
        const listB = parseInput(inputB.value);

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

        resultSets.onlyA = recoverValues(onlyAKeys, mapA, shouldRemoveDupes);
        resultSets.onlyB = recoverValues(onlyBKeys, mapB, shouldRemoveDupes);
        // For common, usually we show the value from A (or B). Let's pick A.
        resultSets.common = recoverValues(commonKeys, mapA, shouldRemoveDupes);

        // 4. Render
        renderList(resOnlyA, resultSets.onlyA, countOnlyA);
        renderList(resOnlyB, resultSets.onlyB, countOnlyB);
        renderList(resCommon, resultSets.common, countCommon);
    }

    function parseInput(text) {
        if (!text) return [];
        // Split by newline
        return text.split(/\r?\n/);
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

    function recoverValues(keys, map, shouldRemoveDupes) {
        let result = [];
        keys.sort(); // Alphabetical sort of keys for consistent output

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

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Clipboard ---

    window.copyResult = (type) => {
        let items = resultSets[type] || [];
        if (items.length === 0) return;

        const text = items.join('\n');

        navigator.clipboard.writeText(text).then(() => {
            const toastEl = document.getElementById('copyToast');
            if (toastEl && typeof bootstrap !== 'undefined') {
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            }
        }).catch(err => {
            console.error('Copy failed', err);
        });
    };

});
