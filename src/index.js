/* © Ashok-777 */
/* GitHub: https://github.com/Ashok-777 */
// 1. App State
const state = {
    weight: 0, height: 0, age: 0, gender: 'Male',
    wUnit: 'kg', hUnit: 'cm',
    history: JSON.parse(localStorage.getItem('health_logs')) || []
};

// 2. Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// 3. Global Functions (Attached to window so HTML can see them)
window.enterApp = function() {
    const landing = document.getElementById('landing-page');
    if (landing) {
        landing.classList.add('fade-out');
        setTimeout(() => {
            landing.style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
        }, 500);
    }
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};

window.toggleTheme = function() {
    const isLight = document.body.classList.toggle('light-mode');
    document.querySelectorAll('.theme-toggle').forEach(i => {
        i.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    });
    lucide.createIcons();
    if (document.getElementById('screen-stats').classList.contains('active')) renderCharts();
};

window.toggleWeightUnit = function() {
    const input = document.getElementById('weight-in');
    let val = parseFloat(input.value) || 0;
    state.wUnit = state.wUnit === 'kg' ? 'lb' : 'kg';
    if(val !== 0) input.value = state.wUnit === 'lb' ? (val * 2.20462).toFixed(2) : (val / 2.20462).toFixed(2);
    document.getElementById('unit-kg').classList.toggle('active', state.wUnit === 'kg');
    document.getElementById('unit-lb').classList.toggle('active', state.wUnit === 'lb');
};

window.toggleHeightUnit = function() {
    const input = document.getElementById('height-in');
    let val = parseFloat(input.value) || 0;
    state.hUnit = state.hUnit === 'cm' ? 'ft' : 'cm';
    if(val !== 0) input.value = state.hUnit === 'ft' ? (val / 30.48).toFixed(2) : (val * 30.48).toFixed(1);
    document.getElementById('unit-cm').classList.toggle('active', state.hUnit === 'cm');
    document.getElementById('unit-ft').classList.toggle('active', state.hUnit === 'ft');
};

window.setGender = function(g) {
    state.gender = g;
    document.getElementById('g-male').classList.toggle('active', g === 'Male');
    document.getElementById('g-female').classList.toggle('active', g === 'Female');
};

window.showScreen = function(id, navEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
        // Check if the nav item's onclick matches the screen ID
        if (n.getAttribute('onclick') && n.getAttribute('onclick').includes(id)) {
            n.classList.add('active');
        }
    });
    if(id === 'screen-stats') renderCharts();
};

window.handleCalculate = function() {
    const wVal = document.getElementById('weight-in').value;
    const hVal = document.getElementById('height-in').value;
    const wIn = parseFloat(wVal);
    const hIn = parseFloat(hVal);

    if (!wVal || wIn <= 0) return showError("Invalid Weight. Please enter a positive number.");
    if (!hVal || hIn <= 0) return showError("Invalid Height. Please enter a positive number.");
    if (state.age <= 0) return showError("Invalid Age. Please select DOB or enter age.");

    state.weight = wIn; state.height = hIn;
    let w = state.wUnit === 'lb' ? wIn / 2.20462 : wIn;
    let h = state.hUnit === 'ft' ? hIn * 30.48 : hIn;
    let bmi = (w / ((h/100)**2)).toFixed(1);
    
    updateResultScreen(bmi, w, h);
    window.showScreen('screen-result');
};

window.saveData = function() {
    const bmiVal = document.getElementById('bmi-val').innerText;
    const entry = {
        date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}),
        bmi: parseFloat(bmiVal),
        weight: state.wUnit === 'lb' ? state.weight / 2.20462 : state.weight,
        meta: document.getElementById('bmi-meta').innerText
    };
    state.history.push(entry);
    localStorage.setItem('health_logs', JSON.stringify(state.history));
    document.getElementById('success-modal').style.display = 'flex';
};

// 4. Internal Helper Functions
function showError(reason) {
    const errorModal = document.getElementById('error-modal');
    const reasonText = document.getElementById('error-reason');
    if (errorModal && reasonText) {
        reasonText.innerText = reason;
        errorModal.style.display = 'flex';
    }
}

function updateResultScreen(bmi, w, h) {
    document.getElementById('bmi-val').innerText = bmi;
    document.getElementById('bmi-meta').innerText = `${w.toFixed(1)}kg | ${h.toFixed(0)}cm | ${state.gender} | ${state.age}yrs`;
    
    let classes = state.age >= 20 ? [
        {n: 'Underweight', v: '< 18.5', m: 0, x: 18.5},
        {n: 'Normal', v: '18.5-24.9', m: 18.5, x: 25},
        {n: 'Overweight', v: '25.0-29.9', m: 25, x: 30},
        {n: 'Obese', v: '≥ 30.0', m: 30, x: 200}
    ] : [
        {n: 'Underweight', v: '< 16.8', m: 0, x: 16.8},
        {n: 'Normal', v: '16.8-24.5', m: 16.8, x: 24.6},
        {n: 'Overweight', v: '24.6-28.8', m: 24.6, x: 28.9},
        {n: 'Obese', v: '≥ 28.9', m: 28.9, x: 200}
    ];

    const table = document.getElementById('classification-table');
    if (table) {
        table.innerHTML = '';
        classes.forEach(c => {
            const active = bmi >= c.m && bmi < c.x;
            if(active) document.getElementById('bmi-cat').innerText = c.n;
            table.innerHTML += `<div class="info-row ${active?'active':''}"><span>${c.n}</span><span>${c.v}</span></div>`;
        });
    }
}

function renderCharts() {
    if (!window.Chart) return;
    const isLight = document.body.classList.contains('light-mode');
    const color = isLight ? '#1c222d' : '#ffffff';
    
    const dataPoints = state.history.slice(-7);
    const labels = dataPoints.length > 0 ? dataPoints.map(d => d.date) : ["No Saved Data"];
    const bmiVals = dataPoints.length > 0 ? dataPoints.map(d => d.bmi) : [0];
    const weightVals = dataPoints.length > 0 ? dataPoints.map(d => d.weight) : [0];

    const options = {
        plugins: { legend: false },
        scales: { x: { ticks: { color } }, y: { ticks: { color }, beginAtZero: true } }
    };

    const ctxBmi = document.getElementById('chart-bmi');
    if (ctxBmi) {
        if (window.bC) window.bC.destroy();
        window.bC = new Chart(ctxBmi, {
            type: 'line', data: { labels, datasets: [{ data: bmiVals, borderColor: '#536dfe', tension: 0.4, pointRadius: 6 }] }, options
        });
    }

    const ctxWeight = document.getElementById('chart-weight');
    if (ctxWeight) {
        if (window.wC) window.wC.destroy();
        window.wC = new Chart(ctxWeight, {
            type: 'line', data: { labels, datasets: [{ data: weightVals, borderColor: '#ff9100', tension: 0.4 }] }, options: { ...options }
        });
    }
}

// 5. DOM Listeners (Run after page load)
window.addEventListener('DOMContentLoaded', () => {
    const dobInput = document.getElementById('dob-input');
    const ageManual = document.getElementById('age-manual');
    const ageDisplay = document.getElementById('age-display');

    if (dobInput) {
        dobInput.addEventListener('change', function() {
            const birthDate = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
            state.age = age;
            if (ageManual) ageManual.value = "";
            if (ageDisplay) ageDisplay.innerText = `Age: ${age} yrs`;
        });
    }

    if (ageManual) {
        ageManual.addEventListener('input', function() {
            state.age = parseInt(this.value) || 0;
            if (dobInput) dobInput.value = "";
            if (ageDisplay) ageDisplay.innerText = `Age: ${state.age} yrs`;
        });
    }
});
/* © Ashok-777 */
/* GitHub: https://github.com/Ashok-777 */
