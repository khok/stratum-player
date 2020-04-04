# Stratum Web Player

Проигрыватель проектов Stratum 2000 в браузере.

### Требования

Для сборки и запуска необходимо установить NodeJS.

Запускаемый проект Stratum должен быть упакован в zip. Примеры проектов можно найти в `static/test_projects`.

### Установка и запуск

Необходимо установить Parcel глобально:

```
npm install -g parcel
```

### Сборка

Сборка файла `dist/stratum.js`:

```
npm run-script build
```

### Использование

см. `src/stratum/api.ts`

### Тесты

Для запуска специального теста выполнить команды:

```
git clone https://github.com/khok/stratum-player
cd stratum-player
npm install
npm test
```

Приложение будет доступно на `localhost:1234`

Запуск всех юнит-тестов:

```
npm test-all
```
