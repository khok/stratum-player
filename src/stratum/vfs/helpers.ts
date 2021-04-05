import { ProjectClassLibrary } from "stratum/common/classLibrary";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { VFSDir, VFSFile } from ".";

export interface ProjectResources {
    dir: VFSDir;
    prjInfo: ProjectInfo;
    classes: ProjectClassLibrary;
    stt?: VariableSet;
}

export async function loadClasses(classDirs: Set<VFSDir>): Promise<ProjectClassLibrary> {
    // 2.3) Исключаем ошибки рекурсивного сканирования имиджей (т.е. если дирректория содержит субдерикторию, вторая удаляется)
    for (let c of classDirs) for (; c !== c.parent; c = c.parent) if (classDirs.has(c.parent)) classDirs.delete(c);

    const dirs = [...classDirs];
    console.log(`Пути поиска имиджей:\n${dirs.map((d) => d.pathDos).join(";\n")}`);

    // 2.4) Загружаем имиджи из выбранных директорий.
    const searchRes = dirs.map((c) => [...c.files(/.+\.cls$/i)]);
    const clsFiles = new Array<VFSFile>().concat(...searchRes);
    const clsProtos = await Promise.all(clsFiles.map((f) => f.readAs("cls")));
    console.log(`Загружено ${clsFiles.length} имиджей объемом ${(clsProtos.reduce((a, b) => a + b.byteSize, 0) / 1024).toFixed()} КБ`);
    return new ProjectClassLibrary(clsProtos);
}

export async function loadProject(prjFile: VFSFile): Promise<ProjectResources> {
    const workDir = prjFile.parent;
    console.log(`Открываем проект ${prjFile.pathDos}`);
    const prjInfo = await prjFile.readAs("prj");

    let classes: ProjectClassLibrary;
    // 2) Загружаем имиджи
    {
        const classDirs = new Set([workDir]);
        // 2.1) Разбираем пути поиска имиджей, которые через запятую прописаны в настройках проекта.
        const settingsPaths = prjInfo.settings?.classSearchPaths;
        if (settingsPaths) {
            //prettier-ignore
            const pathsSeparated = settingsPaths.split(",").map((s) => s.trim()).filter((s) => s);
            for (const path of pathsSeparated) {
                const resolved = workDir.get(path);
                if (resolved?.dir) classDirs.add(resolved);
            }
        }

        classes = await loadClasses(classDirs);
    }

    // 3) Загружаем STT файл.
    let stt: VariableSet | undefined;
    {
        const sttFile = workDir.get("_preload.stt");
        if (sttFile && !sttFile.dir) {
            try {
                stt = await sttFile.readAs("stt");
            } catch (e) {
                console.warn(e.message);
            }
        }
    }

    // 4) Возвращаем результат
    return { dir: workDir, prjInfo, classes, stt };
}
