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

    // Кастомные иконки для маркеров
    const fromIcon = L.divIcon({
        html: '<div style="background-color: #e9c46a; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>',
        iconSize: [24, 24],
        className: 'custom-div-icon'
    });

    const toIcon = L.divIcon({
        html: '<div style="background-color: #e76f51; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>',
        iconSize: [24, 24],
        className: 'custom-div-icon'
    });

    // Начальные координаты (по умолчанию — центр Москвы)
    fromMarker = L.marker([55.755814, 37.617635], { draggable: true, icon: fromIcon }).addTo(map);
    toMarker = L.marker([55.761596, 37.609459], { draggable: true, icon: toIcon }).addTo(map);

    fromMarker.bindTooltip('📦 Погрузка', { permanent: false, direction: 'top' });
    toMarker.bindTooltip('🏁 Выгрузка', { permanent: false, direction: 'top' });

    // Обновление полей при перетаскивании маркера
    fromMarker.on('dragend', () => {
        const latlng = fromMarker.getLatLng();
        document.getElementById('from-lat').value = latlng.lat.toFixed(6);
        document.getElementById('from-lon').value = latlng.lng.toFixed(6);
        // При ручном перемещении маркера очищаем поле адреса
        document.getElementById('from-address').value = '';
        showAlert('resultAlert', '📍 Координаты погрузки обновлены. Адрес необходимо ввести заново для поиска.', 'info');
    });

    toMarker.on('dragend', () => {
        const latlng = toMarker.getLatLng();
        document.getElementById('to-lat').value = latlng.lat.toFixed(6);
        document.getElementById('to-lon').value = latlng.lng.toFixed(6);
        document.getElementById('to-address').value = '';
        showAlert('resultAlert', '📍 Координаты выгрузки обновлены. Адрес необходимо ввести заново для поиска.', 'info');
    });

    // Устанавливаем начальные координаты в поля
    document.getElementById('from-lat').value = '55.755814';
    document.getElementById('from-lon').value = '37.617635';
    document.getElementById('to-lat').value = '55.761596';
    document.getElementById('to-lon').value = '37.609459';

    // Подгоняем карту под маркеры
    const bounds = L.latLngBounds([fromMarker.getLatLng(), toMarker.getLatLng()]);
    map.fitBounds(bounds);
}

// Геокодирование адреса погрузки
async function geocodeFromAddress() {
    const address = document.getElementById('from-address').value;
    const searchBtn = document.getElementById('geocode-from-btn');
    const originalText = searchBtn.textContent;

    if (!address.trim()) {
        showAlert('resultAlert', '❌ Введите адрес погрузки', 'error');
        return;
    }

    searchBtn.textContent = '⏳ Поиск...';
    searchBtn.disabled = true;

    try {
        const coords = await geocodeAddress(address);

        // Обновляем поля координат
        document.getElementById('from-lat').value = coords.lat.toFixed(6);
        document.getElementById('from-lon').value = coords.lon.toFixed(6);

        // Перемещаем маркер на карте
        fromMarker.setLatLng([coords.lat, coords.lon]);

        // Центрируем карту на найденной точке
        map.setView([coords.lat, coords.lon], 14);

        showAlert('resultAlert', `✅ Найден адрес: ${coords.display_name.substring(0, 100)}...`, 'success');

    } catch (err) {
        showAlert('resultAlert', err.message, 'error');
    } finally {
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    }
}

// Геокодирование адреса выгрузки
async function geocodeToAddress() {
    const address = document.getElementById('to-address').value;
    const searchBtn = document.getElementById('geocode-to-btn');
    const originalText = searchBtn.textContent;

    if (!address.trim()) {
        showAlert('resultAlert', '❌ Введите адрес выгрузки', 'error');
        return;
    }

    searchBtn.textContent = '⏳ Поиск...';
    searchBtn.disabled = true;

    try {
        const coords = await geocodeAddress(address);

        document.getElementById('to-lat').value = coords.lat.toFixed(6);
        document.getElementById('to-lon').value = coords.lon.toFixed(6);

        toMarker.setLatLng([coords.lat, coords.lon]);
        map.setView([coords.lat, coords.lon], 14);

        showAlert('resultAlert', `✅ Найден адрес: ${coords.display_name.substring(0, 100)}...`, 'success');

    } catch (err) {
        showAlert('resultAlert', err.message, 'error');
    } finally {
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    }
}

// Расчёт стоимости через Supabase
async function calculatePrice() {
    const fromLat = parseFloat(document.getElementById('from-lat').value);
    const fromLon = parseFloat(document.getElementById('from-lon').value);
    const toLat = parseFloat(document.getElementById('to-lat').value);
    const toLon = parseFloat(document.getElementById('to-lon').value);

    // Валидация
    if (isNaN(fromLat) || isNaN(fromLon) || isNaN(toLat) || isNaN(toLon)) {
        showAlert('resultAlert', '❌ Сначала найдите адреса (нажмите "Найти координаты")', 'error');
        return;
    }

    // Показываем лоадер в блоке результата
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="loader"></div> Загрузка...';

    try {
        const { data, error } = await supabase.rpc('calculate_delivery_price', {
            from_lat: fromLat,
            from_lon: fromLon,
            to_lat: toLat,
            to_lon: toLon
        });

        if (error) throw error;

        resultDiv.innerHTML = `
            <h3>💰 Стоимость доставки</h3>
            <div class="result-price">${formatPrice(data.price)} ₽</div>
            <div class="result-distance">Маршрут: старт → погрузка → выгрузка → финиш</div>
        `;

        showAlert('resultAlert', '✅ Расчёт выполнен успешно!', 'success');

    } catch (err) {
        console.error('Ошибка Supabase:', err);
        resultDiv.innerHTML = `
            <h3>💰 Стоимость доставки</h3>
            <div class="result-price">— ₽</div>
            <div class="result-distance" style="color: #dc3545;">❌ Ошибка: ${err.message || 'Не удалось рассчитать'}</div>
        `;
        showAlert('resultAlert', err.message || 'Ошибка сервера', 'error');
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

    // Навешиваем обработчики на кнопки
    document.getElementById('calcBtn').addEventListener('click', calculatePrice);
    document.getElementById('geocode-from-btn').addEventListener('click', geocodeFromAddress);
    document.getElementById('geocode-to-btn').addEventListener('click', geocodeToAddress);

    // Обработка нажатия Enter в полях адреса
    document.getElementById('from-address').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') geocodeFromAddress();
    });
    document.getElementById('to-address').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') geocodeToAddress();
    });
});