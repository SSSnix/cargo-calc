// =====================================================
// Логика главной страницы (расчёт стоимости)
// =====================================================

let map;
let fromMarker, toMarker;

// Инициализация карты
function initMap() {
    // Центр по умолчанию (Москва)
    const defaultCenter = [55.751244, 37.618423];

    map = L.map('map').setView(defaultCenter, 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Маркеры
    const fromIcon = L.divIcon({
        html: '<div style="background-color: #e9c46a; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>',
        iconSize: [24, 24]
    });

    const toIcon = L.divIcon({
        html: '<div style="background-color: #e76f51; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>',
        iconSize: [24, 24]
    });

    // Начальные координаты из полей
    const fromLat = parseFloat(document.getElementById('from-lat').value);
    const fromLon = parseFloat(document.getElementById('from-lon').value);
    const toLat = parseFloat(document.getElementById('to-lat').value);
    const toLon = parseFloat(document.getElementById('to-lon').value);

    fromMarker = L.marker([fromLat, fromLon], { draggable: true, icon: fromIcon }).addTo(map);
    toMarker = L.marker([toLat, toLon], { draggable: true, icon: toIcon }).addTo(map);

    fromMarker.bindTooltip('📦 Погрузка', { permanent: false, direction: 'top' });
    toMarker.bindTooltip('🏁 Выгрузка', { permanent: false, direction: 'top' });

    // Обновление полей при перетаскивании
    fromMarker.on('dragend', () => {
        const latlng = fromMarker.getLatLng();
        document.getElementById('from-lat').value = latlng.lat.toFixed(6);
        document.getElementById('from-lon').value = latlng.lng.toFixed(6);
    });

    toMarker.on('dragend', () => {
        const latlng = toMarker.getLatLng();
        document.getElementById('to-lat').value = latlng.lat.toFixed(6);
        document.getElementById('to-lon').value = latlng.lng.toFixed(6);
    });

    // Подгоняем карту под маркеры
    const bounds = L.latLngBounds([fromMarker.getLatLng(), toMarker.getLatLng()]);
    map.fitBounds(bounds);
}

// Расчёт стоимости
async function calculatePrice() {
    const fromLat = parseFloat(document.getElementById('from-lat').value);
    const fromLon = parseFloat(document.getElementById('from-lon').value);
    const toLat = parseFloat(document.getElementById('to-lat').value);
    const toLon = parseFloat(document.getElementById('to-lon').value);

    // Валидация
    if (isNaN(fromLat) || isNaN(fromLon) || isNaN(toLat) || isNaN(toLon)) {
        showAlert('resultAlert', '❌ Пожалуйста, заполните все координаты', 'error');
        return;
    }

    // Показываем лоадер
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="loader"></div> Загрузка...';

    try {
        // Вызываем Edge Function в Supabase
        const { data, error } = await supabase.rpc('calculate_delivery_price', {
            from_lat: fromLat,
            from_lon: fromLon,
            to_lat: toLat,
            to_lon: toLon
        });

        if (error) throw error;

        // Отображаем результат
        resultDiv.innerHTML = `
            <div class="result-price">${formatPrice(data.price)} ₽</div>
            <div class="result-distance">Включая маршрут: старт → погрузка → выгрузка → финиш</div>
        `;

        showAlert('resultAlert', '✅ Расчёт выполнен успешно!', 'success');

    } catch (err) {
        console.error('Ошибка:', err);
        resultDiv.innerHTML = '<div style="color: #dc3545;">❌ Ошибка при расчёте. Попробуйте позже.</div>';
        showAlert('resultAlert', err.message || 'Ошибка сервера', 'error');
    }
}

// Обновление маркера из поля ввода
function updateFromMarker() {
    const lat = parseFloat(document.getElementById('from-lat').value);
    const lon = parseFloat(document.getElementById('from-lon').value);
    if (!isNaN(lat) && !isNaN(lon) && fromMarker) {
        fromMarker.setLatLng([lat, lon]);
        map.fitBounds([fromMarker.getLatLng(), toMarker.getLatLng()]);
    }
}

function updateToMarker() {
    const lat = parseFloat(document.getElementById('to-lat').value);
    const lon = parseFloat(document.getElementById('to-lon').value);
    if (!isNaN(lat) && !isNaN(lon) && toMarker) {
        toMarker.setLatLng([lat, lon]);
        map.fitBounds([fromMarker.getLatLng(), toMarker.getLatLng()]);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Ждём загрузки Leaflet
    if (typeof L !== 'undefined') {
        initMap();
    } else {
        console.error('Leaflet не загружен');
    }

    // Навешиваем обработчики
    document.getElementById('calcBtn').addEventListener('click', calculatePrice);
    document.getElementById('from-lat').addEventListener('change', updateFromMarker);
    document.getElementById('from-lon').addEventListener('change', updateFromMarker);
    document.getElementById('to-lat').addEventListener('change', updateToMarker);
    document.getElementById('to-lon').addEventListener('change', updateToMarker);
});