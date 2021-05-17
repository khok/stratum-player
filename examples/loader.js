const runProject = (name, fast, fname) => {
    stratum.options.iconsLocation = "../data/icons";
    const urls = [`./${name}.zip`, "../data/library.zip"];
    const promises = urls.map(url => fetch(url).then(res => res.blob()).then(stratum.unzip))
    Promise.all(promises)
    .then((fsArr) => {
    	const files = [...fsArr[0].files(/.+\.(prj|spj)$/i)];
    	let path;
    	if(fname) {
    		const norm = fsArr[0].path(fname).parts.join("\\").toString().toUpperCase();
            path = files.find((f) => f.toString().toUpperCase().includes(norm));
    	} else {
    		path = files[0];
    	}
        const fs = fsArr.reduce((a, b) => a.merge(b));
        if(document.body) document.body.innerHTML = "Загружаем ресурсы проекта..."
        return stratum.player(path, [{ type: "library", loadClasses: true, dir: fs.path("library") }]);
    })
    .then((prj) => {
        const cb = () => {
        	prj.speed(fast ? "fast" : "smooth", 4);
            document.body.innerHTML = "";
            prj
            .on("closed", () => history.back())
            .on("error", (err) => alert(err))
            .play(document.body);
        }
        if(document.body) cb();
        else window.addEventListener("load", cb);
    })
    .catch((err) => {
        console.error(err);
        if(document.body) document.body.innerHTML = "Не удалось запустить проект :(";
    })
}
