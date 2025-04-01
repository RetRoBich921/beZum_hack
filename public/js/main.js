// Глобальные переменные
let currentUser = null;
let loginBtnJumps = 0;
const maxJumps = 5;

// DOM элементы
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginSubmit = document.getElementById('loginSubmit');
const registerSubmit = document.getElementById('registerSubmit');
const forgotPassword = document.getElementById('forgotPassword');
const countrySelect = document.getElementById('countrySelect');
const eventsList = document.getElementById('eventsList');

// Обработчики событий
loginBtn.addEventListener('mouseover', (e) => {
    if (loginBtnJumps >= maxJumps) return;
    
    const rect = loginBtn.getBoundingClientRect();
    const btnWidth = rect.width;
    const btnHeight = rect.height;
    
    // Получаем доступные размеры экрана
    const maxX = window.innerWidth - btnWidth;
    const maxY = window.innerHeight - btnHeight;
    
    // Генерируем новые координаты
    let newX = Math.random() * maxX;
    let newY = Math.random() * maxY;
    
    // Проверяем, чтобы кнопка не выходила за пределы экрана
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    loginBtn.style.position = 'fixed';
    loginBtn.style.left = `${newX}px`;
    loginBtn.style.top = `${newY}px`;
    
    loginBtnJumps++;
    
    if (loginBtnJumps >= maxJumps) {
        loginBtn.style.position = 'static';
        loginBtn.style.left = 'auto';
        loginBtn.style.top = 'auto';
    }
});

loginBtn.addEventListener('click', () => {
    if (loginBtnJumps >= maxJumps) {
        showModal(loginModal);
    }
});

registerBtn.addEventListener('click', () => showModal(registerModal));
loginSubmit.addEventListener('click', handleLogin);
registerSubmit.addEventListener('click', handleRegister);
forgotPassword.addEventListener('click', handleForgotPassword);
countrySelect.addEventListener('change', loadEvents);

// Функции
function showModal(modal) {
    if (!modal) return;
    modal.style.display = 'block';
}

function hideModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    if (!username) {
        alert('Введите имя пользователя');
        return;
    }
    
    try {
        // Проверяем авторизацию пользователя
        const response = await fetch(`/api/auth/check/${username}`);
        const data = await response.json();
        
        if (!data.isAuthorized) {
            alert('Пользователь не зарегистрирован. Пожалуйста, зарегистрируйтесь.');
            hideModal(loginModal);
            showModal(registerModal);
            return;
        }
        
        if (data.user && data.user.isBanned) {
            alert('Ваш аккаунт заблокирован');
            return;
        }
        
        // Если все проверки пройдены, сохраняем пользователя и его страну
        currentUser = username;
        localStorage.setItem('currentUser', username);
        if (data.user && data.user.country) {
            localStorage.setItem('userCountry', data.user.country);
        }
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Ошибка при входе:', error);
        alert('Ошибка при входе. Попробуйте позже.');
    }
}

// Проверка авторизации при загрузке страницы
async function checkAuth() {
    const username = localStorage.getItem('currentUser');
    if (!username) return false;

    try {
        const response = await fetch(`/api/auth/check/${username}`);
        const data = await response.json();
        
        if (!data.isAuthorized) {
            localStorage.removeItem('currentUser');
            if (window.location.pathname === '/dashboard.html') {
                window.location.href = '/?needRegister=true';
            }
            return false;
        }
        
        if (data.user.isBanned) {
            alert('Ваш аккаунт заблокирован');
            localStorage.removeItem('currentUser');
            window.location.href = '/';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return false;
    }
}

// Обработка регистрации
async function handleRegister() {
    const username = document.getElementById('registerUsername').value;
    const country = document.getElementById('registerCountry').value;
    
    if (!username || !country) {
        alert('Необходимо указать имя пользователя и страну');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, country })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Сохраняем данные пользователя
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userCountry', country);
            alert('Регистрация успешна! Теперь вы можете войти.');
            hideModal(registerModal);
            showModal(loginModal);
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        alert('Ошибка регистрации');
    }
}

function handleForgotPassword() {
    const marquee = document.createElement('div');
    marquee.style.position = 'fixed';
    marquee.style.top = '50%';
    marquee.style.left = '0';
    marquee.style.width = '100%';
    marquee.style.backgroundColor = 'red';
    marquee.style.color = 'white';
    marquee.style.textAlign = 'center';
    marquee.style.padding = '20px';
    marquee.style.fontSize = '24px';
    marquee.textContent = 'ИДИ НАХУЙ';
    
    document.body.appendChild(marquee);
    
    setTimeout(() => {
        document.body.removeChild(marquee);
    }, 5000);
}

// Загрузка событий
async function loadEvents() {
    try {
        const country = document.getElementById('countrySelect').value;
        const response = await fetch(`/api/events?country=${country}`);
        const events = await response.json();
        
        // Проверяем, есть ли события
        if (events.length === 0) {
            eventsList.innerHTML = '<p>Нет доступных событий</p>';
            return;
        }

        const eventsContainer = document.getElementById('eventsList');
        const eventsHtml = events.map(event => `
            <div class="event-card" onclick="showEventDetails(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                <div class="event-image">
                    ${event.image ? `<img src="/uploads/${event.image}" alt="${event.title}">` : '<div class="no-image">Нет изображения</div>'}
                </div>
                <h3>${event.title || 'Без названия'}</h3>
                <p class="event-location">${event.location || 'Местоположение не указано'}</p>
                <p class="event-spots">Доступно мест: ${event.availableSpots || '0'}</p>
            </div>
        `).join('');

        // Создаем контейнер для прокрутки
        eventsContainer.innerHTML = `
            <div class="events-scroll-container">
                <div class="events-scroll-content">
                    ${eventsHtml}
                </div>
            </div>
        `;

        // Добавляем стили для анимации
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .events-scroll-container {
                width: 100%;
                overflow: hidden;
                position: relative;
                padding: 20px 0;
            }

            .events-scroll-content {
                display: flex;
                animation: scrollEvents 10s linear infinite;
                gap: 20px;
                width: max-content;
            }

            .event-card {
                flex: 0 0 300px;
                margin: 0;
                padding: 15px;
                position: relative;
                background: white;
                border-radius: 12px;
                overflow: hidden;
            }

            .event-card::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, 
                    #ff0000, #ff7300, #fffb00, #48ff00,
                    #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
                background-size: 400%;
                z-index: -1;
                animation: rgbBorder 20s linear infinite;
                border-radius: 14px;
            }

            .event-card::after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, 
                    #ff0000, #ff7300, #fffb00, #48ff00,
                    #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
                background-size: 400%;
                z-index: -1;
                filter: blur(5px);
                animation: rgbBorder 20s linear infinite;
                border-radius: 14px;
            }

            @keyframes rgbBorder {
                0% {
                    background-position: 0 0;
                }
                50% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: 400% 0;
                }
            }

            @keyframes scrollEvents {
                0% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(calc(-100%));
                }
            }

            .events-scroll-container:hover .events-scroll-content {
                animation-play-state: paused;
            }

            .event-image {
                width: 100%;
                height: 200px;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 15px;
            }

            .event-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .event-card h3 {
                margin: 10px 0;
                color: #333;
                font-size: 18px;
            }

            .event-location {
                color: #666;
                margin: 5px 0;
            }

            .event-spots {
                color: #4CAF50;
                font-weight: bold;
                margin: 5px 0;
            }
        `;
        document.head.appendChild(styleSheet);

    } catch (error) {
        console.error('Ошибка загрузки событий:', error);
    }
}

// Показ деталей события
function showEventDetails(event) {
    const detailsHtml = `
        <div class="event-details">
            <h2>${event.title || 'Без названия'}</h2>
            ${event.image ? `<img src="/uploads/${event.image}" alt="${event.title}" class="event-details-image">` : ''}
            <div class="event-info">
                <p><strong>Описание:</strong> ${event.description || 'Описание отсутствует'}</p>
                <p><strong>Дата:</strong> ${event.date || 'Не указана'}</p>
                <p><strong>Время:</strong> ${event.time || 'Не указано'}</p>
                <p><strong>Местоположение:</strong> ${event.location || 'Не указано'}</p>
                <p><strong>Страна:</strong> ${event.country || 'Не указана'}</p>
                <p><strong>Доступно мест:</strong> ${event.availableSpots || '0'}</p>
            </div>
            ${currentUser ? `<button onclick="joinQueue('${event.id}')" class="action-button">Занять место</button>` : ''}
            <button onclick="hideEventDetails()" class="close-button">Закрыть</button>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'eventDetailsModal';
    modal.innerHTML = `
        <div class="modal-content">
            ${detailsHtml}
        </div>
    `;
    
    document.body.appendChild(modal);
}

function hideEventDetails() {
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.remove();
    }
}

async function joinQueue(eventId) {
    if (!currentUser) return;
    
    const price = prompt('Введите цену за место:');
    if (!price) return;
    
    try {
        const response = await fetch(`/api/queues/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser,
                price: parseInt(price)
            })
        });
        
        if (response.ok) {
            loadEvents();
        }
    } catch (error) {
        console.error('Ошибка при занятии места:', error);
    }
}

// Функции для админ-панели
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        if (users.length === 0) {
            usersList.innerHTML = '<p>Пользователей пока нет</p>';
            return;
        }
        
        usersList.innerHTML = users.map(user => `
            <div class="user-card">
                <h4>${user.username}</h4>
                <p><strong>Страна:</strong> ${user.country || 'Не указана'}</p>
                <p><strong>Дата регистрации:</strong> ${new Date(user.registrationDate).toLocaleString()}</p>
                <div class="user-actions">
                    <button onclick="banUser('${user.username}')" class="ban-btn">Забанить</button>
                    <button onclick="deleteUser('${user.username}')" class="delete-btn">Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
    }
}

async function banUser(username) {
    try {
        const response = await fetch(`/api/users/${username}/ban`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert(`Пользователь ${username} забанен`);
            loadUsers(); // Перезагружаем список
        } else {
            throw new Error('Ошибка при бане пользователя');
        }
    } catch (error) {
        alert('Ошибка при бане пользователя');
        console.error(error);
    }
}

async function deleteUser(username) {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${username}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert(`Пользователь ${username} удален`);
            loadUsers(); // Перезагружаем список
        } else {
            throw new Error('Ошибка при удалении пользователя');
        }
    } catch (error) {
        alert('Ошибка при удалении пользователя');
        console.error(error);
    }
}

// Функция выхода из админ-панели
function adminLogout() {
    try {
        // Очищаем все данные админа
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('currentUser');
        
        // Показываем сообщение об успешном выходе
        alert('Вы успешно вышли из админ-панели');
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        alert('Произошла ошибка при выходе из админ-панели');
    }
}

// Функции для работы с модальными окнами
function makeDraggable(modal) {
    const content = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === header) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, content);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}

// Инициализация модальных окон
document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        // Делаем окно перетаскиваемым
        makeDraggable(modal);
        
        // Добавляем обработчик закрытия
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => hideModal(modal));
        }
        
        // Закрытие по клику вне окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal);
            }
        });
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthorized = await checkAuth();
    
    // Если мы на странице dashboard и не авторизованы
    if (window.location.pathname === '/dashboard.html' && !isAuthorized) {
        window.location.href = '/?needRegister=true';
        return;
    }
    
    // Если нас перенаправили на главную из-за отсутствия регистрации
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('needRegister')) {
        alert('Необходимо зарегистрироваться для доступа в личный кабинет');
        showModal(registerModal);
    }

    // Скрываем все модальные окна при загрузке
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });

    // Добавляем обработчики для кнопок в админ-панели
    const usersTab = document.getElementById('usersTab');
    if (usersTab) {
        usersTab.addEventListener('click', loadUsers);
    }
    
    // Добавляем обработчик для кнопки выхода из админ-панели
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', adminLogout);
    }

    loadEvents();

    // Запускаем показ рекламы через случайное время
    setTimeout(showRandomAd, getRandomTime());
});

// Функции для работы с рекламой
let adElements = [];
const maxAdsOnScreen = 15; // Максимальное количество рекламы на экране

function createAdElement() {
    const adContainer = document.createElement('div');
    adContainer.className = 'random-ad';
    adContainer.style.zIndex = 9999 + adElements.length; // Каждая новая реклама поверх предыдущей
    
    const adImage = document.createElement('img');
    const closeButton = document.createElement('button');
    closeButton.className = 'ad-close';
    closeButton.textContent = '✕';
    
    closeButton.addEventListener('click', () => {
        adContainer.style.display = 'none';
        adElements = adElements.filter(el => el.container !== adContainer);
        // Сразу показываем новую рекламу
        setTimeout(showRandomAd, 200); // Уменьшаем задержку для более агрессивного появления
    });
    
    adContainer.appendChild(adImage);
    adContainer.appendChild(closeButton);
    document.body.appendChild(adContainer);
    
    return { container: adContainer, image: adImage };
}

function getRandomPosition(element) {
    const maxX = window.innerWidth - 200; // Уменьшаем отступ, чтобы реклама могла наезжать друг на друга
    const maxY = window.innerHeight - 200;
    
    return {
        x: Math.max(0, Math.floor(Math.random() * maxX)),
        y: Math.max(0, Math.floor(Math.random() * maxY))
    };
}

function getRandomTime() {
    // Случайное время от 1 до 3 секунд
    return Math.floor(Math.random() * (3000 - 1000) + 1000);
}

function getRandomAdNumber() {
    return Math.floor(Math.random() * 15) + 1;
}

function showRandomAd() {
    // Удаляем скрытые рекламы из массива
    adElements = adElements.filter(ad => ad.container.style.display !== 'none');
    
    // Создаем от 3 до 5 реклам одновременно для более агрессивного эффекта
    const adsToCreate = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < adsToCreate; i++) {
        if (adElements.length >= maxAdsOnScreen) {
            // Если достигнут лимит, удаляем случайную рекламу вместо самой старой
            const randomIndex = Math.floor(Math.random() * adElements.length);
            const randomAd = adElements.splice(randomIndex, 1)[0];
            randomAd.container.remove();
        }
        
        const newAd = createAdElement();
        adElements.push(newAd);
        
        const adNumber = getRandomAdNumber();
        newAd.image.src = `/images/rec${adNumber}.jpg`;
        
        // Устанавливаем случайную позицию
        const position = getRandomPosition(newAd.container);
        newAd.container.style.left = `${position.x}px`;
        newAd.container.style.top = `${position.y}px`;
        
        // Показываем рекламу
        newAd.container.style.display = 'block';
        
        // Добавляем случайное вращение с большим углом
        const rotation = Math.random() * 40 - 20; // от -20 до +20 градусов
        newAd.container.style.transform = `rotate(${rotation}deg)`;
    }
    
    // Планируем следующий показ с меньшей задержкой
    setTimeout(showRandomAd, getRandomTime());
}