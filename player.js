(function () {
    if (!window.stratum) {
        alert("Библиотека stratum не подключена!");
        return;
    }
    stratum.options.iconsLocation = "./data/icons";

    // Подзагружает все динамически открываемые файлы bmp и vdr.
    const preloadDynamicResources = (fs) => Promise.all([[...fs.search(/.+\.(bmp)|(vdr)$/i)].map((f) => f.makeSync())]);

    // Начинаем загружать стандартную библиотеку.
    let stdlib;
    fetch("./data/library.zip")
        .then((r) => r.blob())
        .then((b) => stratum.unzip(b, { directory: "L:" }))
        .then((fs) => preloadDynamicResources((stdlib = fs)))
        .catch(() => console.error("Не удалось загрузить стандартную библиотеку"));

    // Параллельно загружается окно.
    window.addEventListener("load", () => {
        const dropzoneContainerElem = document.getElementById("dropzone_container");
        const dropzoneStatusElem = document.getElementById("dropzone_status");
        const dropzoneStatusOrigText = dropzoneStatusElem.innerHTML;
        const optionsNolib = document.getElementById("options_nolib");
        const optionsNoResize = document.getElementById("options_noresize");
        const mainWindowContainerElem = document.getElementById("main_window_container");

        let projectLoaded = false;
        const loadProject = async (files) => {
            if (projectLoaded || !files || files.length === 0) return;
            projectLoaded = true;

            // Открываем проект.
            let project;
            try {
                dropzoneStatusElem.innerHTML = `Открываем архив${files.length > 1 ? "ы" : ""} ...`;
                // Распаковываем все закинутые архивы и собираем из них одно целое.
                const fs = (await Promise.all(Array.from(files).map(stratum.unzip))).reduce((a, b) => a.merge(b));

                let tailPath;
                {
                    const projectFiles = [...fs.search(/.+\.(prj)|(spj)$/i)];
                    if (projectFiles.length !== 1) {
                        if (projectFiles.length > 0) {
                            const matches = projectFiles.map((f) => f.pathDos).join("\n");
                            const msg = `Найдено несколько файлов проектов:\n${matches}\nВведите путь/часть пути к файлу проекта:`;
                            tailPath = prompt(msg, projectFiles[0].pathDos);
                        } else {
                            tailPath = prompt("Не найдено файлов проектов. Введите путь/часть пути к файлу проекта:");
                        }
                        dropzoneStatusElem.innerHTML = `Ищем что-нибудь похожее на ${tailPath} ...`;
                    } else {
                        tailPath = projectFiles[0].pathDos;
                        dropzoneStatusElem.innerHTML = `Загружаем проект ${tailPath} ...`;
                    }
                }
                if (!tailPath) {
                    dropzoneStatusElem.innerHTML = dropzoneStatusOrigText;
                    projectLoaded = false;
                    return;
                }

                // Подзагружаем bmp и vdr
                await preloadDynamicResources(fs);

                // Приделываем стандартную библиотеку.
                if (stdlib && !optionsNolib.checked) fs.merge(stdlib);
                // Открываем проект
                project = await fs.project({ additionalClassPaths: ["L:"], tailPath });
                // Попытаемся запустить выполнение проекта прямо здесь.
                // Таким образом перехватываем ошибку на старте.
                project.play({
                    mainWindowContainer: mainWindowContainerElem,
                    disableWindowResize: optionsNoResize.checked,
                });
            } catch (e) {
                projectLoaded = false;
                alert(`При загрузке проекта произошла ошибка:\n${e.message}`);
                dropzoneStatusElem.innerHTML = "Неудача 😿... Попробуем <a href='javascript:selectFile()'>что-нибудь другое</a>?";
                return;
            }
            // Убираем дропзону, т.к. мне пока лень делать релоад проекта при
            // накидывании новых архивов.
            dropzoneContainerElem.remove();

            // Навешиваем калбеки на элементы управления выполнением проекта
            {
                const playerPlayElem = document.getElementById("player_play");
                const playerPauseElem = document.getElementById("player_pause");
                const playerStepElem = document.getElementById("player_step");

                const updateControls = () => {
                    playerPlayElem.value = project.state === "closed" ? "Играть" : "Стоп";
                    playerPauseElem.value = project.state === "paused" ? "Продолжить" : "Пауза";
                    playerPauseElem.disabled = project.state === "closed";
                };

                const handleClick = ({ target }) => {
                    switch (target) {
                        case playerPlayElem:
                            project.state === "closed" ? project.play() : project.close();
                            break;
                        case playerPauseElem:
                            project.state === "paused" ? project.continue() : project.pause();
                            break;
                        case playerStepElem:
                            (project.state === "playing" ? project : project.play()).pause().step();
                            break;
                    }
                    updateControls();
                };
                playerPlayElem.addEventListener("click", handleClick);
                playerPauseElem.addEventListener("click", handleClick);
                playerStepElem.addEventListener("click", handleClick);

                project
                    .on("error", (err) => {
                        console.warn(err);
                        alert("Возникли ошибки, см. в консоли (F12)");
                        updateControls();
                    })
                    .on("closed", () => {
                        alert("Проект остановлен");
                        updateControls();
                    });

                updateControls();
                playerPlayElem.disabled = false;
                playerStepElem.disabled = false;
            }
        };

        // Обработчики набрасывания файла на окно.
        {
            const bodyElem = document.body;
            bodyElem.addEventListener("dragover", (evt) => evt.preventDefault());
            let fileAboveWindow = false;
            bodyElem.addEventListener("dragenter", ({ dataTransfer }) => {
                if (fileAboveWindow || dataTransfer.types.indexOf("Files") < 0) return;
                dropzoneStatusElem.innerHTML = "Отпустите кнопку мыши, чтобы запустить проект...";
                fileAboveWindow = true;
            });
            bodyElem.addEventListener("dragleave", ({ relatedTarget }) => {
                if (!fileAboveWindow || relatedTarget) return;
                dropzoneStatusElem.innerHTML = dropzoneStatusOrigText;
                fileAboveWindow = false;
            });
            bodyElem.addEventListener("drop", (evt) => {
                evt.preventDefault();
                dropzoneStatusElem.innerHTML = dropzoneStatusOrigText;
                fileAboveWindow = false;
                loadProject(evt.dataTransfer.files);
            });
        }
        document.getElementById("zipdrop").addEventListener("change", ({ target: { files } }) => loadProject(files));
    });
})();
const selectFile = () => document.getElementById("zipdrop").click();
