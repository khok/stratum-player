### Запуск примеров

```
npm -g install serve parcel typescript cross-env
git clone https://github.com/khok/stratum-player
cd stratum-player
npm run-script build
cp dist/stratum.js examples
cp -r static/data examples
serve examples
```
