// =====================================================
// Общие функции для всего проекта
// =====================================================

// Инициализация Supabase
const SUPABASE_URL = 'https://xzwlpuvqdookjfxalvag.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rfaI3W2hgAMGsGQfNu2g6Q_AV1lsCKl';

// Создаём глобальный клиент Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = window.supabaseClient; // Дублируем для удобства

console.log('✅ Supabase инициализирован:', window.supabase);

// ========== ФУНКЦИЯ ГЕОКОДИРОВАНИЯ ==========
async function geocodeAddress(address) {
    if (!address || address.trim() === '') {
        throw new Error('Адрес не может быть пустым');
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&accept-language=ru&countrycodes=ru`;

    console.log('🌐 Запрос к Nominatim:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CargoCalculator/1.0 (https://sssnix.github.io/github.io-cargo-calc/)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Ответ:', data);

        if (!data || data.length === 0) {
            throw new Error('Адрес не найден. Попробуйте уточнить запрос.');
        }

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        };

    } catch (err) {
        console.error('Ошибка геокодирования:', err);
        throw new Error(`Не удалось найти адрес: ${err.message}`);
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С УВЕДОМЛЕНИЯМИ ==========
function showAlert(elementId, message, type = 'info') {
    const alertDiv = document.getElementById(elementId);
    if (!alertDiv) return;

    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';

    if (type !== 'error') {
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }
}

function hideAlert(elementId) {
    const alertDiv = document.getElementById(elementId);
    if (alertDiv) {
        alertDiv.style.display = 'none';
    }
}

// ========== ФУНКЦИИ АВТОРИЗАЦИИ ==========
async function checkAuth() {
    const { data: { session } } = await window.supabase.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return null;
    }

    return session;
}

async function logout() {
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
}

// ========== ФУНКЦИИ ФОРМАТИРОВАНИЯ ==========
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

function formatDistance(meters) {
    const km = meters / 1000;
    return `${km.toFixed(2)} км`;
}