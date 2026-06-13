// =====================================================
// Логика админ-панели
// =====================================================

let currentSettings = null;

// Загрузка текущих настроек
async function loadSettings() {
    const userEmailSpan = document.getElementById('userEmail');
    const settingsContainer = document.getElementById('settingsContainer');

    try {
        // Получаем текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            userEmailSpan.textContent = user.email;
        }

        // Загружаем настройки из таблицы
        const { data, error } = await supabase
            .from('delivery_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) throw error;

        currentSettings = data;

        // Заполняем форму
        document.getElementById('start-lat').value = data.start_lat;
        document.getElementById('start-lon').value = data.start_lon;
        document.getElementById('finish-lat').value = data.finish_lat;
        document.getElementById('finish-lon').value = data.finish_lon;
        document.getElementById('tariff').value = data.tariff_per_km;

        settingsContainer.style.display = 'block';
        showAlert('adminAlert', '✅ Настройки загружены', 'success');

    } catch (err) {
        console.error('Ошибка загрузки:', err);
        settingsContainer.style.display = 'none';
        showAlert('adminAlert', '❌ Не удалось загрузить настройки. Возможно, у вас нет прав.', 'error');
    }
}

// Сохранение настроек
async function saveSettings(event) {
    event.preventDefault();

    const startLat = parseFloat(document.getElementById('start-lat').value);
    const startLon = parseFloat(document.getElementById('start-lon').value);
    const finishLat = parseFloat(document.getElementById('finish-lat').value);
    const finishLon = parseFloat(document.getElementById('finish-lon').value);
    const tariff = parseInt(document.getElementById('tariff').value);

    // Валидация
    if (isNaN(startLat) || isNaN(startLon) || isNaN(finishLat) || isNaN(finishLon) || isNaN(tariff)) {
        showAlert('adminAlert', '❌ Все поля должны быть заполнены корректно', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '⏳ Сохранение...';
    saveBtn.disabled = true;

    try {
        const { error } = await supabase
            .from('delivery_settings')
            .update({
                start_lat: startLat,
                start_lon: startLon,
                finish_lat: finishLat,
                finish_lon: finishLon,
                tariff_per_km: tariff,
                updated_at: new Date()
            })
            .eq('id', 1);

        if (error) throw error;

        showAlert('adminAlert', '✅ Настройки успешно сохранены!', 'success');

    } catch (err) {
        console.error('Ошибка сохранения:', err);
        showAlert('adminAlert', '❌ Ошибка при сохранении: ' + err.message, 'error');

    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Выход
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Проверка авторизации
async function initAdmin() {
    const session = await checkAuth();
    if (!session) return;

    await loadSettings();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();

    // Навешиваем обработчики
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});