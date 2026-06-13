// =====================================================
// Общие функции для всего проекта
// =====================================================

// Инициализация Supabase
const SUPABASE_URL = 'https://xzwlpuvqdookjfxalvag.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rfaI3W2hgAMGsGQfNu2g6Q_AV1lsCKl';

// Создаём клиент Supabase
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!supabase) {
    console.error('Supabase не загружен! Проверьте подключение библиотеки.');
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