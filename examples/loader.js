const runProject = (name) => {
    stratum.options.iconsLocation = "../data/icons";
    const urls = [`./${name}.zip`, "../data/library.zip"];
    const promises = urls.map(url => fetch(url).then(res => res.blob()).then(stratum.unzip))
    Promise.all(promises)
    .then(async (fsArr) => {
        const fs = fsArr.reduce((a, b) => a.merge(b));
        if(document.body) document.body.innerHTML = "Подзагруажем BMP и VDR файлы..."
        await Promise.all([...fs.search(/.+\.(bmp)|(vdr)$/i)].map((f) => f.makeSync()))
        if(document.body) document.body.innerHTML = "Загружаем ресурсы проекта..."
        return fs.project({ additionalClassPaths: ["library"] });
    })
    .then(prj => {
        if(!document.body) window.onload = () => prj.play(document.body);
        else {
            document.body.innerHTML = "";
            prj.play(document.body);
        }
    })
    .catch((err) => {
        console.error(err);
        if(document.body) document.body.innerHTML = "Не удалось запустить проект :(";
    })
}
