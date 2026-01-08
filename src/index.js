const state = {
    weight: 0, height: 0, age: 0, gender: 'Male',
    wUnit: 'kg', hUnit: 'cm',
    history: JSON.parse(localStorage.getItem('health_logs')) || []
};

// Initialize icons immediately
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Attach all functions to window to make them globally accessible
window.showError = function(reason) {
    document.getElementById('error-reason').innerText = reason;
    document.getElementById('error-modal').style.display = 'flex';
};

window.showSuccess = function() {
    document.getElementById('success-modal').style.display = 'flex';
};

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
};

window.toggleTheme = function() {
    const isLight = document.body.classList.toggle('light-mode');
    document.querySelectorAll('.theme-toggle').forEach(i => {
        i.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    });
    lucide.createIcons();
    if (document.getElementById('screen-stats').classList.contains('active')) renderCharts();
};

window.enterApp = function() {
    document.getElementById('landing-page').classList.add('fade-out');
    setTimeout(() => {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
    }, 500);
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
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
        if (n.getAttribute('onclick').includes(id)) n.classList.add('active');
    });
    if(id === 'screen-stats') renderCharts();
};

window.handleCalculate = function() {
    const wVal = document.getElementById('weight-in').value;
    const hVal = document.getElementById('height-in').value;
    const wIn = parseFloat(wVal);
    const hIn = parseFloat(hVal);

    if (!wVal || wIn <= 0) return showError("Reason: Invalid Weight. Please Enter correct data.");
    if (!hVal || hIn <= 0) return showError("Reason: Invalid Height. Please Enter correct data.");
    if (state.age <= 0) return showError("Reason: Invalid Age. Please Enter correct data.");

    state.weight = wIn; state.height = hIn;
    let w = state.wUnit === 'lb' ? wIn / 2.20462 : wIn;
    let h = state.hUnit === 'ft' ? hIn * 30.48 : hIn;
    let bmi = (w / ((h/100)**2)).toFixed(1);
    
    updateResultScreen(bmi, w, h);
    showScreen('screen-result');
};

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
    table.innerHTML = '';
    classes.forEach(c => {
        const active = bmi >= c.m && bmi < c.x;
        if(active) document.getElementById('bmi-cat').innerText = c.n;
        table.innerHTML += `<div class="info-row ${active?'active':''}"><span>${c.n}</span><span>${c.v}</span></div>`;
    });
}

window.saveData = function() {
    const entry = {
        date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}),
        bmi: parseFloat(document.getElementById('bmi-val').innerText),
        weight: state.wUnit === 'lb' ? state.weight / 2.20462 : state.weight,
        meta: document.getElementById('bmi-meta').innerText
    };
    state.history.push(entry);
    localStorage.setItem('health_logs', JSON.stringify(state.history));
    showSuccess();
};

function renderCharts() {
    if(!window.Chart) return;
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

    if (window.bC) window.bC.destroy();
    window.bC = new Chart(document.getElementById('chart-bmi'), {
        type: 'line', data: { labels, datasets: [{ data: bmiVals, borderColor: '#536dfe', tension: 0.4, pointRadius: 6 }] }, options
    });

    if (window.wC) window.wC.destroy();
    window.wC = new Chart(document.getElementById('chart-weight'), {
        type: 'line', data: { labels, datasets: [{ data: weightVals, borderColor: '#ff9100', tension: 0.4 }] }, options: { ...options, onClick: null }
    });
}

// Event listeners for inputs (these run automatically)
window.onload = function() {
    document.getElementById('dob-input').addEventListener('change', function() {
        const birthDate = new Date(this.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
        state.age = age;
        document.getElementById('age-manual').value = "";
        document.getElementById('age-display').innerText = `Age: ${age} yrs`;
    });

    document.getElementById('age-manual').addEventListener('input', function() {
        state.age = parseInt(this.value) || 0;
        document.getElementById('dob-input').value = "";
        document.getElementById('age-display').innerText = `Age: ${state.age} yrs`;
    });
};
