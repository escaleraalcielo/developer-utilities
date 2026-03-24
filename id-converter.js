document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const inputEl = document.getElementById('inputData');
    const outputEl = document.getElementById('outputData');
    const optionSoqlEl = document.getElementById('optionSoql');
    const inputStatsEl = document.getElementById('inputStats');
    const outputStatsEl = document.getElementById('outputStats');
    const validationMessageEl = document.getElementById('validationMessage');
    const validationTextEl = document.getElementById('validationText');
    const copyBtn = document.getElementById('copyBtn');

    // Event Listeners
    inputEl.addEventListener('input', updateConversion);
    optionSoqlEl.addEventListener('change', updateConversion);

    // --- Core Logic ---

    function updateConversion() {
        const rawInput = inputEl.value;
        const lines = rawInput.split(/\r?\n/);

        let validIds = 0;
        let invalidIds = 0;
        let processedIds = [];

        inputStatsEl.textContent = `${lines.length} lines`;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // Skip empty lines

            // Validate
            if (trimmed.length === 15 || trimmed.length === 18) {
                const converted = to18CharId(trimmed);
                processedIds.push(converted);
                validIds++;
            } else {
                // Invalid ID length
                processedIds.push(trimmed + " [INVALID]");
                invalidIds++;
            }
        });

        // Toggle Output
        let result = "";
        const isSoql = optionSoqlEl.checked;

        if (isSoql) {
            // Filter out invalids for clean query? Or keep them?
            // Usually for SOQL you want only valid strings
            // Let's keep them but formatted strings
            const formatted = processedIds.map(id => {
                if (id.includes("[INVALID]")) return id; // Don't quote invalids
                return `'${id}'`;
            });
            result = formatted.join(', ');
        } else {
            result = processedIds.join('\n');
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
