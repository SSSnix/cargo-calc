// =====================================================
// Логика страницы входа
// =====================================================

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const submitBtn = document.getElementById('submitBtn');

    // Скрываем предыдущее сообщение об ошибке
    errorDiv.style.display = 'none';

    // Показываем лоадер на кнопке
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Вход...';
    submitBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Успешный вход — перенаправляем в админку
        window.location.href = 'admin.html';

    } catch (err) {
        console.error('Ошибка входа:', err);
        errorDiv.textContent = err.message || 'Неверный email или пароль';
        errorDiv.style.display = 'block';
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, не залогинен ли уже пользователь
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            // Если уже залогинен — сразу в админку
            window.location.href = 'admin.html';
        }
    });

    // Навешиваем обработчик на форму
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});