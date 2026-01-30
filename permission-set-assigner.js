document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const permSetIdInput = document.getElementById('permSetId');
    const userIdsInput = document.getElementById('userIds');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const outputPreview = document.getElementById('outputPreview');
    const validationMessage = document.getElementById('validationMessage');
    const validationText = document.getElementById('validationText');
    const inputStats = document.getElementById('inputStats');
    const outputStats = document.getElementById('outputStats');
    const dropZone = document.getElementById('dropZone');

    let csvContent = ''; // Store generated CSV blob content

    // --- Event Listeners ---
    permSetIdInput.addEventListener('input', validateBase);
    userIdsInput.addEventListener('input', () => {
        validateBase();
        updateStats();
    });

    generateBtn.addEventListener('click', generateCSV);

    downloadBtn.addEventListener('click', () => {
        if (!csvContent) return;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Assignment_Upload.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Logic ---

    function updateStats() {
        const text = userIdsInput.value;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        inputStats.textContent = `${lines.length} lines`;
    }

    // Basic validation to enable/disable generate button (UX only)
    function validateBase() {
        // We handle strict validation on Generate click
        validationMessage.classList.add('d-none');
    }

    function generateCSV() {
        const permId = permSetIdInput.value.trim();
        const userText = userIdsInput.value;

        // 1. Validate Perm Set ID
        if (permId.length !== 15 && permId.length !== 18) {
            showError(`Permission Set ID must be 15 or 18 characters. Current: ${permId.length}`);
            return;
        }

        // 2. Parse User IDs
        const lines = userText.split(/\r?\n/);
        const validUserIds = lines
            .map(l => l.trim())
            .filter(l => l.length > 0); // We assume anything non-empty is a potentially valid ID for generation, though Salesforce is strict.

        if (validUserIds.length === 0) {
            showError('Please provide at least one User ID.');
            return;
        }

        // 3. Generate content
        // Header: "_","AssigneeId","PermissionSetId"
        const rows = [];
        rows.push('"_","AssigneeId","PermissionSetId"');

        validUserIds.forEach(userId => {
            // Format: "[PermissionSetAssignment]","005...","0PS..."
            rows.push(`"[PermissionSetAssignment]","${userId}","${permId}"`);
        });

        csvContent = rows.join('\n');

        // 4. Update Preview
        // Show first few lines
        outputPreview.value = csvContent;

        // Update Stats and UI
        outputStats.textContent = `${validUserIds.length} rows generated`;
        validationMessage.classList.add('d-none');
        downloadBtn.disabled = false;

        // Flash success feedback on Generate button
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="bi bi-check-circle"></i> Generated!';
        generateBtn.classList.remove('btn-primary');
        generateBtn.classList.add('btn-success');

        setTimeout(() => {
            generateBtn.innerHTML = originalText;
            generateBtn.classList.add('btn-primary');
            generateBtn.classList.remove('btn-success');
        }, 1500);
    }

    function showError(msg) {
        validationText.textContent = msg;
        validationMessage.classList.remove('d-none');
        downloadBtn.disabled = true;
        outputPreview.value = '';
        csvContent = '';
    }

    // --- Drag and Drop ---

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-active');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-active');
    }

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            readFile(files[0]);
        }
    }

    function readFile(file) {
        // Check if text/csv
        // Simple check, reading as text anyway
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            // Append or replace? Let's replace for simplicity as users usually drop a full list.
            userIdsInput.value = reader.result;
            updateStats();
            validateBase();
        };
    }

    // Initialize stats
    updateStats();
});
