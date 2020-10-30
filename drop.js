(function () {
    if (!window.stratum) {
        alert("Библиотека stratum не подключена!");
        return;
    }
    stratum.options.iconsLocation =  "./data/icons"

    function preloadRes(fs) {
        // Подзагружает все динамически открываемые файлы bmp и vdr.
        return Promise.all(fs.search(/.+\.(bmp)|(vdr)$/i).map((f) => f.makeSync()));
    }

    var stdlibfs;
    // Начинаем загружать стандартную библиотеку.
    fetch("./data/library.zip")
        .then((r) => r.blob())
        .then(stratum.unzip)
        .then((fs) => {
            stdlibfs = fs;
            preloadRes(fs);
        });

    // Параллельно ждем пока загрузится окно.
    window.addEventListener("load", async () => {
        globalCanvas = document.getElementById("canvas");
        globalCanvas.width = window.innerWidth - 40;
        globalCanvas.height = window.innerHeight - 100;
        htmlRoot = document.getElementById("root");
        zipdropElem = document.getElementById("zipdrop");

        // Создаем обработчик закидывания архивов.
        zipdropElem.addEventListener("change", async (evt) => {
            if (!evt.target.files || evt.target.files.length === 0) return;

            // Открываем проект...
            var project, ws;
            try {
                // Распаковываем все закинутые архивы.
                fsArray = await Promise.all(Array.from(evt.target.files).map(stratum.unzip));
                // Собираем распакованные архивы в одно целое.
                fs = fsArray.reduce((a, b) => a.mount(b));

                prjfilepath = undefined;
                const res = fs.search(/.+\.(prj)|(spj)$/i).map((r) => r.path);
                if (res.length !== 1) {
                    if (res.length > 0) {
                        prjfilepath = prompt(
                            `Обнаружено несколько файлов проектов:\n${res.join("\n")}\nВведите хвостовую часть пути к файлу.`,
                            res[0]
                        );
                    } else {
                        prjfilepath = prompt("Не найдено файлов проектов. Введите путь к нему:");
                    }
                    if (!prjfilepath) return;
                }

                // Подзагружаем bmp и vdr
                await preloadRes(fs);
                // Приделываем стандартную библиотеку.
                fs.mount(stdlibfs);
                project = await fs.project({ additionalClassPaths: ["library"], path: prjfilepath });
                // Создаем оконный хост.
                ws = stratum.ws({ globalCanvas, htmlRoot, disableSceneResize: false });
                // Запускаем (пытаемся) выполнение проекта прямо здесь. Таким
                // образом перехватываем ошибку на старте.
                project.play(ws);
            } catch (e) {
                alert(`При открытии проекта произошла ошибка:\n${e.message}`);
                return;
            }

            // Уберем дропзону, т.к. мне пока лень делать релоад проекта при
            // накидывании новых архивов.
            zipdropElem.remove();

            // Навешиваем обработчики на кнопки
            againElem = document.getElementById("again");
            pauseElem = document.getElementById("pause");
            stepElem = document.getElementById("step");
            stopElem = document.getElementById("stop");

            function updatePauseElem() {
                pauseElem.innerHTML = project.state === "paused" ? "Продолжить" : "Пауза";
            }

            function handleState(closed) {
                pauseElem.disabled = stepElem.disabled = stopElem.disabled = closed;
                againElem.innerHTML = closed ? "Играть" : "Заново";
            }

            function handler(evt) {
                id = evt.target.id;
                switch (id) {
                    case "again":
                        project.close().play();
                        handleState(false);
                        break;
                    case "pause":
                        if (project.state === "paused") project.continue();
                        else project.pause();
                        break;
                    case "step":
                        project.play().pause().step();
                        break;
                    case "stop":
                        project.close();
                        handleState(true);
                        break;
                }
                updatePauseElem();
            }
            againElem.addEventListener("click", handler);
            pauseElem.addEventListener("click", handler);
            stepElem.addEventListener("click", handler);
            stopElem.addEventListener("click", handler);

            // Навешиваем обработчики событий проекта.
            project
                .on("error", (err) => {
                    handleState(true);
                    console.warn(err);
                    alert("Возникли ошибки, см. в консоли (F12)");
                })
                .on("closed", () => {
                    handleState(true);
                    console.log("Проект остановлен");
                });

            // Запускаем цикл перерисовки окна
            function cb() {
                requestAnimationFrame(cb);
                ws.redraw();
            }
            requestAnimationFrame(cb);

            // Активируем кнопки.
            handleState(false);
            againElem.disabled = false;
        });
    });
})();
