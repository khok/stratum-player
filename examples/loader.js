const runProject = (name) => {
    stratum.options.iconsLocation = "../data/icons";
    const urls = [`./${name}.zip`, "../data/library.zip"];
    const promises = urls.map(url => fetch(url).then(res => res.blob()).then(stratum.unzip))
    Promise.all(promises).then(async (fsArr) => {
        const fs = fsArr.reduce((a, b) => a.merge(b));
        await Promise.all([...fs.search(/.+\.(bmp)|(vdr)$/i)].map((f) => f.makeSync()))
        return fs.project({ additionalClassPaths: ["library"] });
    }).then(prj => prj.play(document.body));
}
