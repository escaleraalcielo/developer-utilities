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
        window.copyToClipboard(cronOutput.textContent, 'Cron expression copied!');
    });
});
