document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const jobNameInput = document.getElementById('jobNameInput');
    const jobNameOutput = document.getElementById('jobNameOutput');

    const frequencySelect = document.getElementById('frequencySelect');
    const hourSelect = document.getElementById('hourSelect');
    const minuteSelect = document.getElementById('minuteSelect');

    const weeklyOptions = document.getElementById('weeklyOptions');
    const monthlyOptions = document.getElementById('monthlyOptions');
    const dayCheckboxes = document.querySelectorAll('.day-checkbox');
    const dayOfMonthSelect = document.getElementById('dayOfMonthSelect');
    const customDayDiv = document.getElementById('customDayDiv');
    const customDayInput = document.getElementById('customDayInput');

    const cronOutput = document.getElementById('cronOutput');
    const cronStringExp = document.getElementById('cronStringExp');
    const copyBtn = document.getElementById('copyBtn');

    const history = new HistoryManager({
        getType: () => 'Cron',
        getPreview: (item) => (item.preview || '').substring(0, 100)
    });

    // Populate Hour Dropdown
    for (let i = 0; i < 24; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = i.toString().padStart(2, '0');
        hourSelect.appendChild(option);
    }
    hourSelect.value = "0";

    // Event Listeners for UI changes
    frequencySelect.addEventListener('change', updateUI);
    hourSelect.addEventListener('change', generateCron);
    minuteSelect.addEventListener('change', generateCron);
    dayCheckboxes.forEach(cb => cb.addEventListener('change', generateCron));
    dayOfMonthSelect.addEventListener('change', () => {
        customDayDiv.classList.toggle('d-none', dayOfMonthSelect.value !== 'custom');
        generateCron();
    });
    customDayInput.addEventListener('input', generateCron);
    jobNameInput.addEventListener('input', updateJobName);

    // Initial Setup
    updateUI();
    generateCron();

    function updateUI() {
        const freq = frequencySelect.value;

        // Hide/Show specific panels
        weeklyOptions.classList.add('d-none');
        monthlyOptions.classList.add('d-none');

        if (freq === 'hourly') {
            hourSelect.disabled = true;
        } else {
            hourSelect.disabled = false;
        }

        if (freq === 'weekly') {
            weeklyOptions.classList.remove('d-none');
        } else if (freq === 'monthly') {
            monthlyOptions.classList.remove('d-none');
        }

        generateCron();
    }

    function generateCron() {
        const freq = frequencySelect.value;
        const minute = minuteSelect.value;
        const hour = hourSelect.disabled ? '*' : hourSelect.value;

        let seconds = '0';
        let dayOfMonth = '*';
        let month = '*';
        let dayOfWeek = '?';
        let year = ''; // Optional, typically omitted

        if (freq === 'hourly') {
            dayOfMonth = '*';
            dayOfWeek = '?';
        } else if (freq === 'daily') {
            dayOfMonth = '*';
            dayOfWeek = '?';
        } else if (freq === 'weekly') {
            dayOfMonth = '?';
            const selectedDays = Array.from(dayCheckboxes)
                                    .filter(cb => cb.checked)
                                    .map(cb => cb.value);
            dayOfWeek = selectedDays.length > 0 ? selectedDays.join(',') : '*';
        } else if (freq === 'monthly') {
            dayOfWeek = '?';
            const domSelection = dayOfMonthSelect.value;
            if (domSelection === 'custom') {
                const val = parseInt(customDayInput.value, 10);
                dayOfMonth = (val >= 1 && val <= 31) ? val.toString() : '1';
            } else {
                dayOfMonth = domSelection;
            }
        }

        // Apex Cron Format: Seconds Minutes Hours Day_of_month Month Day_of_week optional_year
        const cronStr = `${seconds} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

        cronOutput.textContent = cronStr;
        cronStringExp.textContent = cronStr;
    }

    function updateJobName() {
        const newJobName = jobNameInput.value.trim() || 'My Job Name';
        jobNameOutput.textContent = newJobName;
    }

    // Copy Action
    copyBtn.addEventListener('click', () => {
        const cronStr = cronOutput.textContent;
        const jobName = jobNameInput.value.trim() || 'My Job Name';
        history.add({
            value: cronStr,
            preview: `${cronStr} (${jobName})`
        });
        copyToClipboard(cronStr, 'Cron expression copied!');
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
