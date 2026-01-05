// your code goes here
let gender = 'male';
let units = { height: 'cm', weight: 'kg' };
let history = JSON.parse(localStorage.getItem('healthHistory')) || [];

lucide.createIcons();
updateAge(25);

function setGender(g) {
    gender = g;
    document.getElementById('gender-male').style.border =
        g === 'male' ? '2px solid var(--primary)' : 'none';
    document.getElementById('gender-female').style.border =
        g === 'female' ? '2px solid var(--primary)' : 'none';
}

function setUnit(type, unit) {
    units[type] = unit;
    const btns = event.target.parentElement.querySelectorAll('.toggle-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function updateAge(val) {
    document.getElementById('age-display').innerText = val;
}

function showScreen(screenId, navEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (navEl) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        navEl.classList.add('active');
    }
    if (screenId === 'stats-screen') initCharts();
}

function calculateBMI() {
    let weight = parseFloat(document.getElementById('weight-input').value);
    let height = parseFloat(document.getElementById('height-input').value);

    if (units.weight === 'lb') weight *= 0.453592;
    if (units.height === 'ft') height *= 30.48;

    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    displayResult(bmi);
}

function displayResult(bmi) {
    const valEl = document.getElementById('res-value');
    const catEl = document.getElementById('res-category');
    const ring = document.getElementById('bmi-ring');

    valEl.innerText = bmi;

    let cat = '';
    let color = '';

    if (bmi < 18.5) { cat = 'Underweight'; color = '#60a5fa'; }
    else if (bmi < 25) { cat = 'Normal'; color = '#22c55e'; }
    else if (bmi < 30) { cat = 'Overweight'; color = '#eab308'; }
    else { cat = 'Obese'; color = '#ef4444'; }

    catEl.innerText = cat;
    catEl.style.color = color;
    ring.style.borderColor = color;

    showScreen('result-screen');
}

function saveRecord() {
    const record = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: parseFloat(document.getElementById('weight-input').value),
        bmi: parseFloat(document.getElementById('res-value').innerText)
    };

    history.push(record);
    if (history.length > 7) history.shift();
    localStorage.setItem('healthHistory', JSON.stringify(history));

    alert("Progress Saved!");
    showScreen('stats-screen');
}

let weightChart, bmiChart;

function initCharts() {
    const ctxW = document.getElementById('weightChart').getContext('2d');
    const ctxB = document.getElementById('bmiChart').getContext('2d');

    const labels = history.map(h => h.date);
    const weights = history.map(h => h.weight);
    const bmis = history.map(h => h.bmi);

    if (weightChart) weightChart.destroy();
    if (bmiChart) bmiChart.destroy();

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            x: { ticks: { color: '#94a3b8' } }
        }
    };

    weightChart = new Chart(ctxW, {
        type: 'line',
        data: { labels, datasets: [{ data: weights, borderColor: '#f97316', tension: 0.4, fill: true }] },
        options: commonOptions
    });

    bmiChart = new Chart(ctxB, {
        type: 'line',
        data: { labels, datasets: [{ data: bmis, borderColor: '#6366f1', tension: 0.4, fill: true }] },
        options: commonOptions
    });
}
