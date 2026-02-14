/**
 * Clima Vivo - Core Logic
 * Author: Jesus Martinez
 */

const CONFIG = {
    DEFAULT_LOCATION: { lat: 4.7110, lon: -74.0721, name: "Bogotá" },
    REFRESH_INTERVAL: 600000, // 10 minutes
};

// --- Core Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    registerEventListeners();
    await loadWeather();
    setInterval(loadWeather, CONFIG.REFRESH_INTERVAL);
}

function registerEventListeners() {
    const reloadBtn = document.querySelector('.reload-btn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => loadWeather());
    }
}

// --- Weather Logic ---

async function loadWeather() {
    showLoading(true);
    try {
        const location = await getLocation();
        const data = await fetchWeatherData(location.lat, location.lon);
        updateUI(data);
    } catch (error) {
        console.error('Weather Load Error:', error);
        showError('No se pudo sincronizar el clima. Reintenta en un momento.');
    } finally {
        setTimeout(() => showLoading(false), 500);
    }
}

async function getLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            resolve(CONFIG.DEFAULT_LOCATION);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => {
                console.warn('Geolocation denied/failed', err);
                resolve(CONFIG.DEFAULT_LOCATION);
            },
            { timeout: 10000 }
        );
    });
}

async function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Response Error');
    return await response.json();
}

// --- UI Updates ---

function updateUI(data) {
    const { current } = data;
    const weather = interpretWeatherCode(current.weather_code);
    const isNight = isNightTime();
    
    // Update Body Theme
    document.body.className = `${weather.theme} ${isNight ? 'night-mode' : 'day-mode'}`;
    if (isNight) document.body.classList.add('night');

    // Update Main Info
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
        <div class="weather-card">
            <h2 class="location-title">Tu Ubicación</h2>
            <p class="weather-desc">${weather.description}</p>
            
            <span class="temperature">${Math.round(current.temperature_2m)}°C</span>
            
            <div class="weather-details">
                <div class="detail-box">
                    <p class="detail-label">Humedad</p>
                    <p class="detail-value">${current.relative_humidity_2m}%</p>
                </div>
                <div class="detail-box">
                    <p class="detail-label">Viento</p>
                    <p class="detail-value">${current.wind_speed_10m} <small>km/h</small></p>
                </div>
                <div class="detail-box">
                    <p class="detail-label">Condición</p>
                    <p class="detail-value">${isNight ? 'Noche' : 'Día'}</p>
                </div>
            </div>
        </div>
    `;

    updateAnimations(weather.type, isNight);
}

function interpretWeatherCode(code) {
    // Open-Meteo WMO Codes
    const map = {
        0: { type: 'sun', theme: 'day', description: 'Cielo Despejado' },
        1: { type: 'sun', theme: 'day', description: 'Casi Despejado' },
        2: { type: 'cloud', theme: 'cloudy', description: 'Parcialmente Nublado' },
        3: { type: 'cloud', theme: 'cloudy', description: 'Nublado' },
        45: { type: 'cloud', theme: 'cloudy', description: 'Niebla' },
        48: { type: 'cloud', theme: 'cloudy', description: 'Escarcha' },
        51: { type: 'rain', theme: 'rainy', description: 'Llovizna Ligera' },
        53: { type: 'rain', theme: 'rainy', description: 'Llovizna' },
        55: { type: 'rain', theme: 'rainy', description: 'Llovizna Intensa' },
        61: { type: 'rain', theme: 'rainy', description: 'Lluvia Fina' },
        63: { type: 'rain', theme: 'rainy', description: 'Lluvia' },
        65: { type: 'rain', theme: 'rainy', description: 'Lluvia Fuerte' },
        71: { type: 'snow', theme: 'snowy', description: 'Nieve Ligera' },
        73: { type: 'snow', theme: 'snowy', description: 'Nieve' },
        75: { type: 'snow', theme: 'snowy', description: 'Nevada Intensa' },
        77: { type: 'snow', theme: 'snowy', description: 'Granizo' },
        80: { type: 'rain', theme: 'rainy', description: 'Chubascos' },
        81: { type: 'rain', theme: 'rainy', description: 'Chubascos Fuertes' },
        82: { type: 'rain', theme: 'rainy', description: 'Chubascos Violentos' },
        95: { type: 'storm', theme: 'stormy', description: 'Tormenta' },
        96: { type: 'storm', theme: 'stormy', description: 'Tormenta con Granizo' },
        99: { type: 'storm', theme: 'stormy', description: 'Tormenta Eléctrica' },
    };
    return map[code] || { type: 'cloud', theme: 'cloudy', description: 'Clima Variado' };
}

function isNightTime() {
    const hour = new Date().getHours();
    return hour < 6 || hour > 18;
}

// --- Animation Engine ---

function updateAnimations(type, isNight) {
    clearAnimations();
    const body = document.body;

    if (isNight) {
        createStars();
        createMoon();
    }

    switch(type) {
        case 'sun':
            if (!isNight) createSun();
            break;
        case 'cloud':
            createClouds(5);
            break;
        case 'rain':
            createClouds(3, true);
            createRain();
            break;
        case 'snow':
            createClouds(3);
            createSnow();
            break;
        case 'storm':
            createClouds(4, true);
            createRain();
            initLightning();
            break;
    }
}

function clearAnimations() {
    const selectors = ['.sky-element', '.rain-container', '.snow-container', '.lightning'];
    selectors.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));
}

function createStars() {
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'sky-element star';
        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 80}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
        document.body.appendChild(star);
    }
}

function createMoon() {
    const moon = document.createElement('div');
    moon.className = 'sky-element moon';
    document.body.appendChild(moon);
}

function createSun() {
    const sun = document.createElement('div');
    sun.className = 'sky-element sun';
    document.body.appendChild(sun);
}

function createClouds(count, dark = false) {
    for (let i = 0; i < count; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'sky-element cloud';
        if (dark) cloud.style.background = 'rgba(50, 50, 60, 0.8)';
        cloud.style.width = `${100 + Math.random() * 200}px`;
        cloud.style.height = `${40 + Math.random() * 60}px`;
        cloud.style.top = `${Math.random() * 60}%`;
        cloud.style.setProperty('--duration', `${20 + Math.random() * 40}s`);
        cloud.style.animationDelay = `${-Math.random() * 40}s`;
        document.body.appendChild(cloud);
    }
}

function createRain() {
    const container = document.createElement('div');
    container.className = 'rain-container';
    for (let i = 0; i < 120; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(drop);
    }
    document.body.appendChild(container);
}

function createSnow() {
    const container = document.createElement('div');
    container.className = 'sky-element snow-container';
    for (let i = 0; i < 80; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        const size = 3 + Math.random() * 7;
        flake.style.width = `${size}px`;
        flake.style.height = `${size}px`;
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDuration = `${3 + Math.random() * 5}s`;
        flake.style.animationDelay = `${Math.random() * 5}s`;
        flake.style.setProperty('--opacity', Math.random());
        container.appendChild(flake);
    }
    document.body.appendChild(container);
}

function initLightning() {
    const lightning = document.createElement('div');
    lightning.className = 'lightning';
    document.body.appendChild(lightning);

    const strike = () => {
        if (!document.querySelector('.lightning')) return;
        lightning.classList.add('flash');
        setTimeout(() => lightning.classList.remove('flash'), 200);
        setTimeout(strike, 3000 + Math.random() * 7000);
    };
    setTimeout(strike, 2000);
}

// --- Helpers ---

function showLoading(show) {
    let loader = document.querySelector('.loading-screen');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'loading-screen';
            loader.innerHTML = '<div class="spinner"></div><p>Sincronizando cielo...</p>';
            document.body.appendChild(loader);
        }
        loader.classList.remove('hidden');
    } else {
        if (loader) loader.classList.add('hidden');
    }
}

function showError(msg) {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `<div class="error-box"><p>${msg}</p><button onclick="loadWeather()" class="retry-btn">Reintentar</button></div>`;
}
