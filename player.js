(function () {
    stratum.options.iconsLocation = "./data/icons";

    // Начинаем загружать стандартную библиотеку.
    let stdlib;
    fetch("./data/library.zip")
        .then((r) => r.blob())
        .then((b) => stratum.unzip(b, { directory: "L:" }))
        .then((fs) => (stdlib = fs))
        .catch(() => console.error("Не удалось загрузить стандартную библиотеку"));

    // Параллельно загружается окно.
    window.addEventListener("load", () => {
        const dropzoneContainerElem = document.getElementById("dropzone_container");
        const dropzoneStatusElem = document.getElementById("dropzone_status");
        const dropzoneStatusOrigText = dropzoneStatusElem.innerHTML;
        const optionsFastComputing = document.getElementById("options_fast_computing");
        const optionsNolib = document.getElementById("options_nolib");
        // const optionsNoResize = document.getElementById("options_noresize");
        const mainWindowContainerElem = document.getElementById("main_window_container");

        const playerPlayElem = document.getElementById("player_play");
        const playerPauseElem = document.getElementById("player_pause");
        const playerStepElem = document.getElementById("player_step");

        let currentProject = undefined;

        const removeCurrentProject = () => {
            playerPlayElem.disabled = true;
            playerStepElem.disabled = true;
            currentProject = undefined;
        };

        const updateControls = () => {
            playerPlayElem.value = currentProject.state === "closed" ? "Играть" : "Стоп";
            playerPauseElem.value = currentProject.state === "paused" ? "Продолжить" : "Пауза";
            playerPauseElem.disabled = currentProject.state === "closed";
            dropzoneContainerElem.hidden = currentProject.state !== "closed";
        };
        const updateOptions = () => {
            // currentProject.options.disableWindowResize = optionsNoResize.checked;
            currentProject.speed(optionsFastComputing.checked ? "fast" : "smooth", 4);
        };
        {
            const handleClick = ({ target }) => {
                switch (target) {
                    case playerPlayElem: {
                        if (currentProject.state === "closed") {
                            updateOptions();
                            currentProject.play();
                        } else {
                            currentProject.close();
                        }
                        break;
                    }
                    case playerPauseElem:
                        currentProject.state === "paused" ? currentProject.continue() : currentProject.pause();
                        break;
                    case playerStepElem:
                        (currentProject.state === "playing" ? currentProject : currentProject.play()).pause().step();
                        break;
                }
                updateControls();
            };
            playerPlayElem.addEventListener("click", handleClick);
            playerPauseElem.addEventListener("click", handleClick);
            playerStepElem.addEventListener("click", handleClick);
        }

        let projectLoading = false;
        const loadProject = async (files) => {
            if (projectLoading || (currentProject && currentProject.state !== "closed") || !files || files.length === 0) return;
            projectLoading = true;
            dropzoneStatusElem.innerHTML = `Открываем архив${files.length > 1 ? "ы" : ""} ...`;

            try {
                // Распаковываем все закинутые архивы и собираем из них одно целое.
                const fs = (await Promise.all(Array.from(files).map(stratum.unzip))).reduce((a, b) => a.merge(b));

                let path;
                {
                    const projectFiles = [...fs.files(/.+\.(prj|spj)$/i)];
                    if (projectFiles.length !== 1) {
                        let srch;
                        if (projectFiles.length > 0) {
                            const matches = projectFiles.map((f) => f.toString()).join("\n");
                            const msg = `Найдено несколько файлов проектов:\n${matches}\nВведите путь/часть пути к файлу проекта:`;
                            srch = prompt(msg, projectFiles[0].toString());
                        } else {
                            srch = prompt("Не найдено файлов проектов. Введите путь/часть пути к файлу проекта:");
                        }

                        const norm = fs.path(srch).parts.join("\\").toString().toUpperCase();
                        path = projectFiles.find((f) => f.toString().toUpperCase().includes(norm));
                    } else {
                        path = projectFiles[0];
                    }
                }
                if (!path) {
                    dropzoneStatusElem.innerHTML = dropzoneStatusOrigText;
                    return;
                }
                dropzoneStatusElem.innerHTML = `Загружаем проект ${path} ...`;

                // Приделываем стандартную библиотеку.
                if (stdlib && !optionsNolib.checked) fs.merge(stdlib);
                // Открываем проект
                currentProject = await stratum.player(path, [{ type: "library", loadClasses: true, dir: fs.path("L:") }]);
                updateOptions();
                // Попытаемся запустить выполнение проекта прямо здесь.
                // Таким образом перехватываем ошибку на старте.
                currentProject.play(mainWindowContainerElem);
            } catch (e) {
                removeCurrentProject();
                alert(`При загрузке проекта произошла ошибка:\n${e.message}`);
                dropzoneStatusElem.innerHTML = "Неудача 😿... Попробуем <a href='javascript:selectFile()'>что-нибудь другое</a>?";
                return;
            } finally {
                projectLoading = false;
            }

            currentProject
                .on("error", (err) => {
                    alert("В ходе выполнения проекта возникла ошибка:\n" + err);
                    updateControls();
                })
                .on("closed", () => {
                    updateControls();
                });

            updateControls();
            playerPlayElem.disabled = false;
            playerStepElem.disabled = false;
            dropzoneStatusElem.innerHTML = dropzoneStatusOrigText;
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
