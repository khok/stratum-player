# stratum-player

Проигрыватель проектов Stratum 2000 в браузере.

## Как запустить?

Установите какой-нибудь простой файловый сервер, например [serve](https://www.npmjs.com/package/serve)

Затем скопируйте скрипт библиотеки (_dist/index.min.js_) и проект с мячиками в _examples_, запустите сервер и откройте страницу в браузере.

```
cp dist/index.min.js static/projects/balls.zip examples
serve examples
```

## Запуск моих проектов Stratum 2000

Скопируйте скрипт библиотеки и статичные файлы (иконки + стандартная библиотека
имиджей) в _examples_, запустите сервер.

```
cp -r dist/index.min.js static/data examples
serve examples
```

Плеер будет доступен по адресу http://localhost:5000/drop

Теперь просто заархивируйте любой имеющийся у вас проект Stratum 2000 и бросьте
его на веб-страницу. Если у вас установлен Stratum 2000, то примеры проектов
можно найти в каталоге
_C:\Program Files\Stratum 2000\PROJECTS\samples_.

Если у вас не имеется Stratum-проектов, можно попробовать что-нибудь из _static/projects_.

## API

API описано в `dist/index.d.ts`.

## Сборка библиотеки, запуск тестов.

Необходим установленный [Node.js](https://nodejs.org/en/)

### Установка зависимостей

```
npm -g install esbuild typescript browserify
npm install
```

### Запуск демо

```
npm run live
```

### Юнит-тесты

```
npm run unit
```

### Сборка

```
npm run build
```

Бандл будет сохранен в _dist/index.min.js_
Тайпинги будут сохранены в _dist/index.d.ts_
