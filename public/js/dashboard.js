// Проверка авторизации
document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('currentUser');
    const userCountry = localStorage.getItem('userCountry');
    
    if (!username) {
        window.location.href = '/';
        return;
    }
    
    // Отображение информации о пользователе
    document.getElementById('userLogin').textContent = username;
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileStatus').textContent = 'Активный';
    
    // Показ кнопки админ-панели для admin
    if (username === 'admin') {
        document.getElementById('adminPanelBtn').style.display = 'block';
    }
    
    // Загрузка событий и информации о местах в очереди
    loadEvents();
    loadUserQueues();
});

// Функции для работы с вкладками
function showTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем нужную вкладку
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Обновляем активную кнопку
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Загрузка событий
async function loadEvents() {
    try {
        const username = localStorage.getItem('currentUser');
        const userCountry = localStorage.getItem('userCountry');
        
        if (!userCountry && username !== 'admin') {
            document.getElementById('eventsList').innerHTML = '<p>Выберите страну в главном меню</p>';
            return;
        }
        
        const response = await fetch(`/api/events${username === 'admin' ? '' : `?country=${userCountry}`}`);
        const events = await response.json();
        
        const eventsList = document.getElementById('eventsList');
        if (events.length === 0) {
            eventsList.innerHTML = '<p>Нет доступных мероприятий в вашей стране</p>';
            return;
        }
        
        // Получаем информацию о занятых местах пользователя
        const queueResponse = await fetch(`/api/queues/user/${username}`);
        const userQueues = await queueResponse.json();
        
        eventsList.innerHTML = events.map(event => {
            const userQueue = userQueues.find(q => q.eventId === event.id);
            const buttonHtml = userQueue 
                ? `<p class="queue-number">Ваш номер в очереди: ${userQueue.queueNumber}</p>`
                : `<button class="join-queue-btn" onclick="joinQueue('${event.id}')" ${event.availableSpots <= 0 ? 'disabled' : ''}>
                    ${event.availableSpots <= 0 ? 'Мест нет' : 'Занять место'}
                   </button>`;
            
            return `
                <div class="event-card">
                    ${event.image ? `<img src="/uploads/${event.image}" alt="${event.title}" class="event-image">` : ''}
                    <h3>${event.title}</h3>
                    <p class="event-description">${event.description}</p>
                    <p class="event-info"><strong>Дата:</strong> ${event.date}</p>
                    <p class="event-info"><strong>Время:</strong> ${event.time}</p>
                    <p class="event-info"><strong>Местоположение:</strong> ${event.location}</p>
                    <p class="event-info"><strong>Страна:</strong> ${event.country}</p>
                    <p class="event-spots"><strong>Доступных мест:</strong> ${event.availableSpots}</p>
                    ${buttonHtml}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки событий:', error);
        document.getElementById('eventsList').innerHTML = '<p>Ошибка при загрузке мероприятий</p>';
    }
}

// Функция для загрузки очередей пользователя
async function loadUserQueues() {
    const username = localStorage.getItem('currentUser');
    if (!username) return;

    try {
        // Получаем очереди пользователя
        const response = await fetch(`/api/queues/user/${username}`);
        const queues = await response.json();

        const queuesContainer = document.querySelector('.user-queues');
        if (!queuesContainer) {
            // Если контейнер не существует, создаем его
            const tabContent = document.getElementById('queuesTab');
            if (tabContent) {
                const newContainer = document.createElement('div');
                newContainer.className = 'user-queues';
                tabContent.appendChild(newContainer);
            }
        }

        const container = document.querySelector('.user-queues');
        if (!container) return;

        if (!queues || queues.length === 0) {
            container.innerHTML = `
                <div class="no-queues-message" style="text-align: center; padding: 20px; color: #fff;">
                    <h3>У вас пока нет занятых мест в очередях</h3>
                    <p>Перейдите на главную страницу, чтобы занять место в интересующем вас мероприятии</p>
                </div>
            `;
            return;
        }

        // Отображаем очереди пользователя
        container.innerHTML = `
            <h2 class="queues-title">Ваши места в очередях</h2>
            <div class="queues-grid">
                ${queues.map(queue => `
                    <div class="queue-card">
                        <div class="queue-header">
                            <h3>${queue.eventTitle || 'Без названия'}</h3>
                            <span class="queue-number">Место: ${queue.queueNumber}</span>
                        </div>
                        <div class="queue-info">
                            <p><strong>Дата:</strong> ${queue.eventDate || 'Не указана'}</p>
                            <p><strong>Время:</strong> ${queue.eventTime || 'Не указано'}</p>
                            <p><strong>Локация:</strong> ${queue.eventLocation || 'Не указана'}</p>
                            <p><strong>Цена:</strong> ${queue.price || '0'} ₽</p>
                            <p><strong>Занято:</strong> ${new Date(queue.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Добавляем стили для карточек очередей
        const style = document.createElement('style');
        style.textContent = `
            .queues-title {
                color: #fff;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                font-family: "Comic Sans MS", cursive;
            }
            
            .queues-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                padding: 20px;
            }
            
            .queue-card {
                background: rgba(78, 22, 9, 0.8);
                border: 2px solid #ff0000;
                border-radius: 10px;
                padding: 15px;
                color: #fff;
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
                transition: all 0.3s ease;
                animation: glow 2s infinite alternate;
            }
            
            .queue-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
            }
            
            .queue-header {
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                margin-bottom: 10px;
                padding-bottom: 10px;
            }
            
            .queue-header h3 {
                margin: 0;
                color: #ff0000;
                text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
                font-family: "Comic Sans MS", cursive;
            }
            
            .queue-number {
                display: inline-block;
                background: #ff0000;
                padding: 3px 8px;
                border-radius: 5px;
                margin-top: 5px;
                font-weight: bold;
            }
            
            .queue-info p {
                margin: 5px 0;
                font-size: 14px;
            }
            
            .queue-info strong {
                color: #ff9900;
            }
            
            @keyframes glow {
                from {
                    box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
                }
                to {
                    box-shadow: 0 0 20px rgba(255, 0, 0, 0.6);
                }
            }
            
            .no-queues-message {
                background: rgba(78, 22, 9, 0.8);
                border: 2px solid #ff0000;
                border-radius: 10px;
                padding: 20px;
                margin: 20px;
                text-align: center;
                animation: glow 2s infinite alternate;
            }
            
            .no-queues-message h3 {
                color: #ff0000;
                text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
                font-family: "Comic Sans MS", cursive;
                margin-bottom: 10px;
            }
        `;
        document.head.appendChild(style);

    } catch (error) {
        console.error('Ошибка при загрузке очередей:', error);
        const container = document.querySelector('.user-queues');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="color: red; text-align: center; padding: 20px;">
                    Произошла ошибка при загрузке очередей. Пожалуйста, попробуйте позже.
                </div>
            `;
        }
    }
}

// Выход из системы
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}

// Занятие места в очереди
async function joinQueue(eventId) {
    const username = localStorage.getItem('currentUser');
    const price = prompt('Введите цену за место:');
    if (!price) return;
    
    try {
        const response = await fetch(`/api/queues/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                price: parseInt(price)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Вы заняли ${data.queueNumber} место в очереди! Осталось мест: ${data.availableSpots}`);
            loadEvents(); // Перезагружаем список событий
            loadUserQueues(); // Обновляем список занятых мест
        } else {
            alert(data.message || 'Не удалось занять место в очереди');
        }
    } catch (error) {
        console.error('Ошибка при занятии места:', error);
        alert('Произошла ошибка при попытке занять место');
    }
}

// Функция для загрузки информации о пользователе
async function loadUserInfo() {
    const username = localStorage.getItem('currentUser');
    const country = localStorage.getItem('userCountry');
    
    if (!username) {
        window.location.href = '/';
        return;
    }

    const userInfoElement = document.querySelector('.user-info');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <h2>Профиль пользователя</h2>
            <p><strong>Имя:</strong> ${username}</p>
            <p><strong>Страна:</strong> ${country || 'Не указана'}</p>
            <div class="user-stats">
                <p><strong>Дата регистрации:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Статус:</strong> Активный</p>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadUserQueues();
    
    // Добавляем обработчики для вкладок
    const tabs = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Убираем активный класс у всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс выбранной вкладке
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });
}); 