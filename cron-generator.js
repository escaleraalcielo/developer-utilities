document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // Copy Action
    copyBtn.addEventListener('click', () => {
        copyToClipboard(cronOutput.textContent, 'Cron expression copied!');
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
