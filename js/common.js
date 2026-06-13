// =====================================================
// Общие функции для всего проекта
// =====================================================

// Инициализация Supabase (замените на свои данные!)
const SUPABASE_URL = 'https://ваш-проект.supabase.co';
const SUPABASE_ANON_KEY = 'ваш-публичный-анонимный-ключ';

// Создаём клиент Supabase
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!supabase) {
    console.error('Supabase не загружен! Проверьте подключение библиотеки.');
}

// Преобразует текстовый адрес в координаты (широта/долгота)
async function geocodeAddress(address) {
    if (!address || address.trim() === '') {
        throw new Error('Адрес не может быть пустым');
    }

    // Nominatim требует указать User-Agent (ваше приложение)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'ru', // Предпочитаем русские названия
                'User-Agent': 'CargoCalculator/1.0' // Обязательно для Nominatim!
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('Адрес не найден. Попробуйте уточнить запрос.');
        }

        const result = data[0];
        return {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            display_name: result.display_name
        };

    } catch (err) {
        console.error('Ошибка геокодирования:', err);
        throw new Error(`Не удалось найти адрес: ${err.message}`);
    }
}

// Показать уведомление
function showAlert(elementId, message, type = 'info') {
    const alertDiv = document.getElementById(elementId);
    if (!alertDiv) return;

    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';

    // Скрыть через 5 секунд для информационных сообщений
    if (type !== 'error') {
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }
}

// Скрыть уведомление
function hideAlert(elementId) {
    const alertDiv = document.getElementById(elementId);
    if (alertDiv) {
        alertDiv.style.display = 'none';
    }
}

// Проверка авторизации (для админ-панели)
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return null;
    }

    return session;
}

// Выход из системы
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

// Форматирование расстояния
function formatDistance(meters) {
    const km = meters / 1000;
    return `${km.toFixed(2)} км`;
}