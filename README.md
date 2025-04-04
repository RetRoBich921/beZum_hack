# Queue Market - Платформа для торговли местами в очередях

## Описание
Queue Market - это уникальная платформа, позволяющая пользователям покупать и продавать места в очередях на различные события (концерты, спортивные мероприятия, выставки и т.д.). Пользователи могут занимать места в очередях, устанавливать свою цену и продавать их другим участникам.

## Основные функции
- Выбор страны и просмотр доступных событий
- Система регистрации и авторизации пользователей
- Возможность занимать места в очередях
- Покупка и продажа мест между пользователями
- Административная панель для управления событиями

## Технологии
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Хранение данных: In-memory (оперативная память)

## Установка и запуск

### Предварительные требования
- Node.js (версия 14 или выше)
- npm (Node Package Manager)

### Шаги по установке

1. Клонируйте репозиторий:
```bash
git clone [URL репозитория]
cd queue-market
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите проект:
```bash
npm start
```

После запуска приложение будет доступно по адресу: `http://localhost:3000`

## Структура проекта
```
queue-market/
├── public/
│   ├── index.html
│   ├── styles/
│   └── images/
├── src/
│   ├── server.js
│   ├── routes/
│   └── models/
├── package.json
└── README.md
```

## Особенности реализации
- Уникальный интерфейс с интерактивными элементами
- Система очередей с возможностью торговли местами
- Административная панель для управления событиями
- Хранение данных в оперативной памяти

## Планы по развитию
- [ ] Интеграция реальных платежных систем
- [ ] Улучшенная система аутентификации
- [ ] Возможность создания пользовательских событий
- [ ] Рейтинговая система
- [ ] Система уведомлений
- [ ] Мобильная версия
- [ ] Многоязычность

## Лицензия
MIT