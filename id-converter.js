document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const optionSoqlEl = document.getElementById('optionSoql');
    const optionCleanEl = document.getElementById('optionClean');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const validationMessageEl = document.getElementById('validationMessage');
    const validationTextEl = document.getElementById('validationText');
    const copyBtn = document.getElementById('copyBtn');
    const removedContainer = document.getElementById('removedContainer');
    const removedDataEl = document.getElementById('removedData');

    // Event Listeners
    inputEl.addEventListener('input', updateConversion);
    optionSoqlEl.addEventListener('change', updateConversion);
    optionCleanEl.addEventListener('change', updateConversion);

    // --- Core Logic ---

    function updateConversion() {
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        let validIds = 0;
        let invalidIds = 0;
        let processedIds = [];
        let cleanValidIds = [];
        let cleanInvalidIds = [];

        inputStatsEl.textContent = `${lines.length} lines`;
        const isClean = optionCleanEl.checked;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // Skip empty lines

            // Validate
            if (trimmed.length === 15 || trimmed.length === 18) {
                const converted = to18CharId(trimmed);
                processedIds.push(converted);
                cleanValidIds.push(converted);
                validIds++;
            } else {
                // Invalid ID length
                processedIds.push(trimmed + " [INVALID]");
                cleanInvalidIds.push(trimmed); // plain unformatted for clean list
                invalidIds++;
            }
        });

        // Toggle Output
        let result = "";
        const isSoql = optionSoqlEl.checked;

        if (isClean) {
            if (isSoql) {
                const formatted = cleanValidIds.map(id => `'${id}'`);
                result = formatted.join(', ');
            } else {
                result = cleanValidIds.join('\n');
            }
            removedDataEl.value = cleanInvalidIds.join('\n');

            if (invalidIds > 0) {
                removedContainer.classList.remove('d-none');
                removedContainer.classList.add('d-flex');
            } else {
                removedContainer.classList.add('d-none');
                removedContainer.classList.remove('d-flex');
            }
        } else {
            removedContainer.classList.add('d-none');
            removedContainer.classList.remove('d-flex');

            if (isSoql) {
                const formatted = processedIds.map(id => {
                    if (id.includes("[INVALID]")) return id; // Don't quote invalids
                    return `'${id}'`;
                });
                result = formatted.join(', ');
            } else {
                result = processedIds.join('\n');
            }
        }

        outputEl.value = result;
        outputStatsEl.textContent = `${validIds} valid, ${invalidIds} invalid`;

        // Validation UI
        if (invalidIds > 0) {
            validationMessageEl.classList.remove('d-none');
            validationTextEl.textContent = `${invalidIds} invalid ID(s) detected.`;
            inputEl.classList.add('border-warning');
        } else {
            validationMessageEl.classList.add('d-none');
            inputEl.classList.remove('border-warning');
        }
    }

    // --- Copy Logic ---
    copyBtn.addEventListener('click', () => {
        if (!outputEl.value) return;

        outputEl.select();
        window.copyToClipboard(outputEl.value, 'IDs copied to clipboard!');
    });

});
