const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

// Создаем папку uploads, если её нет
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Только изображения разрешены!'), false);
        }
        cb(null, true);
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Обработчик загрузки файла
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    res.json({ 
        success: true, 
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
});

// Хранение данных в памяти
const data = {
    users: [],
    events: [],
    queues: {},
    whitelist: ['admin', 'albert2006', 'ivanzolo2007', 'gеймер1', 'CuCe4Ka', 'xAkEp_HaXeP', 'NIGGA_KillER'],
    userCountries: {}
};

// Белый список пользователей
let whiteList = [];

// Маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API для регистрации
app.post('/api/register', (req, res) => {
    const { username, country } = req.body;
    
    if (!username || !country) {
        return res.status(400).json({ error: 'Необходимо указать имя пользователя и страну' });
    }
    
    // Проверяем, не занят ли никнейм
    if (whiteList.includes(username)) {
        return res.status(400).json({ error: 'Этот никнейм уже занят' });
    }
    
    // Добавляем пользователя в белый список
    whiteList.push(username);
    
    // Добавляем информацию о пользователе
    data.users.push({
        username,
        country,
        registrationDate: new Date().toISOString(),
        isBanned: false
    });
    
    res.json({ message: 'Регистрация успешна', username });
});

// API для проверки авторизации
app.get('/api/auth/check/:username', (req, res) => {
    const { username } = req.params;
    
    if (!username) {
        return res.status(400).json({ error: 'Необходимо указать имя пользователя' });
    }
    
    // Проверяем, есть ли пользователь в белом списке
    const isAuthorized = whiteList.includes(username);
    
    // Проверяем, не забанен ли пользователь
    const user = data.users.find(u => u.username === username);
    const isBanned = user ? user.isBanned : false;
    
    if (isBanned) {
        return res.status(403).json({ error: 'Пользователь забанен' });
    }
    
    res.json({ 
        isAuthorized,
        user: isAuthorized ? user : null
    });
});

// API для получения белого списка (только для админа)
app.get('/api/whitelist', (req, res) => {
    res.json(whiteList);
});

// Получение страны пользователя
app.get('/api/user/country/:username', (req, res) => {
    const { username } = req.params;
    const country = data.userCountries[username];
    if (!country) {
        return res.status(404).json({ error: 'Страна пользователя не найдена' });
    }
    res.json({ country });
});

// Обновление страны пользователя
app.post('/api/user/country', (req, res) => {
    const { username, country } = req.body;
    if (!username || !country) {
        return res.status(400).json({ error: 'Необходимо указать пользователя и страну' });
    }
    data.userCountries[username] = country;
    res.json({ success: true, message: 'Страна успешно обновлена', country });
});

// API для событий
app.get('/api/events', (req, res) => {
    const { country } = req.query;
    if (country) {
        const filteredEvents = data.events.filter(event => event.country === country);
        res.json(filteredEvents);
    } else {
        res.json(data.events);
    }
});

app.post('/api/events', (req, res) => {
    const event = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
        country: req.body.country,
        availableSpots: parseInt(req.body.availableSpots),
        image: req.body.image
    };
    
    data.events.push(event);
    // Инициализируем массив очередей для нового события
    data.queues[event.id] = [];
    res.json({ success: true, event });
});

app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const index = data.events.findIndex(event => event.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Событие не найдено' });
    }
    data.events.splice(index, 1);
    delete data.queues[id];
    res.json({ success: true });
});

// Получение информации о местах пользователя в очередях
app.get('/api/queues/user/:username', (req, res) => {
    const { username } = req.params;
    
    // Собираем все очереди пользователя из всех событий
    const userQueues = [];
    
    // Перебираем все события и их очереди
    Object.keys(data.queues).forEach(eventId => {
        const queueInfo = data.queues[eventId].find(q => q.username === username);
        if (queueInfo) {
            const event = data.events.find(e => e.id === eventId);
            if (event) {
                userQueues.push({
                    ...queueInfo,
                    eventTitle: event.title,
                    eventDate: event.date,
                    eventTime: event.time,
                    eventLocation: event.location,
                    eventId: eventId
                });
            }
        }
    });
    
    res.json(userQueues);
});

// API для очередей
app.post('/api/queues/:eventId', (req, res) => {
    const { eventId } = req.params;
    const { username, price } = req.body;
    
    const event = data.events.find(e => e.id === eventId);
    if (!event) {
        return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    if (event.availableSpots <= 0) {
        return res.status(400).json({ message: 'Нет свободных мест' });
    }
    
    // Инициализируем массив очередей для события, если его нет
    if (!data.queues[eventId]) {
        data.queues[eventId] = [];
    }
    
    // Проверяем, не занял ли пользователь уже место
    const existingQueue = data.queues[eventId].find(q => q.username === username);
    if (existingQueue) {
        return res.status(400).json({ message: 'Вы уже заняли место в этой очереди' });
    }
    
    // Уменьшаем количество доступных мест
    event.availableSpots--;
    
    // Определяем номер в очереди (количество занятых мест + 1)
    const queueNumber = data.queues[eventId].length + 1;
    
    // Добавляем информацию о месте в очереди
    const queueInfo = {
        eventId,
        username,
        price: parseInt(price),
        queueNumber,
        timestamp: new Date().toISOString()
    };
    
    data.queues[eventId].push(queueInfo);
    
    res.json({ 
        message: 'Место успешно занято',
        queueNumber,
        availableSpots: event.availableSpots
    });
});

// Получение информации о местах пользователя в очередях
app.get('/api/queues/user/:username', (req, res) => {
    const { username } = req.params;
    const userQueues = data.queues[req.params.eventId]
        .filter(q => q.username === username)
        .map(q => {
            const event = data.events.find(e => e.id === q.eventId);
            return {
                ...q,
                eventTitle: event ? event.title : 'Неизвестное событие',
                eventDate: event ? event.date : '',
                eventTime: event ? event.time : '',
                eventLocation: event ? event.location : ''
            };
        });
    res.json(userQueues);
});

// Добавляем тестовые данные при запуске
function addTestData() {
    // Добавляем тестового пользователя admin
    if (!data.users.includes('admin')) {
        data.users.push('admin');
    }
    
    // Добавляем тестовое событие
    if (data.events.length === 0) {
        data.events.push({
            id: '1',
            title: 'Тестовое событие',
            description: 'Это тестовое событие для проверки функциональности',
            date: '2024-12-31',
            time: '23:59',
            availableSpots: 100,
            country: 'russia'
        });
    }
}

// Инициализация тестовых данных
addTestData();

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
}); 