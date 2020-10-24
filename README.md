# Stratum Web Player

Проигрыватель проектов Stratum 2000 в браузере.

### Требования

Для сборки и запуска необходимо установить NodeJS.
Запускаемый проект Stratum должен быть упакован в zip. Примеры проектов можно найти в `static/projects`.

### Устанвка зависимостей

```
npm -g install esbuild typescript browserify
npm install
```

### Демо

```
npm run demo
```

### Сборка

```
npm run build
```

Бандл будет сохранен в _dist/index.min.js_

### Тесты

```
npm run test
```

### API

API описано в `src/stratum/api.ts`

Простой пример использования:

_dist/index.html_ :

```
<script src="index.min.js"></script>
<script>
    alert(stratum.version)
</script>
```
