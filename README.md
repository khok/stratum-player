# Stratum Web Player

Проигрыватель проектов Stratum 2000 в браузере.

### Требования

Для сборки и запуска необходимы NodeJS и Yarn.

Проект Stratum должен быть упакован в zip. Примеры проектов можно найти в `static/test_projects`.

### Установка и запуск

Необходимо установить Parcel глобально:

```
yarn global add parcel
```

### Сборка

Сборка файла `dist/player.js`:

```
yarn build
```

### Использование

см. `src/stratum/api.ts`

### Тесты

Для запуска специального теста выполнить команды:

```
git clone https://github.com/khok/stratum-player
cd stratum-player
yarn install
yarn test
```

Приложение будет доступно на `localhost:1234`

Запуск всех юнит-тестов:

```
yarn test-all
```
