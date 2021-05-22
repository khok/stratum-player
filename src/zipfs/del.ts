// import { DirInfo, FileInfo } from "stratum/api";
// import { VariableSet } from "stratum/fileFormats/stt";
// import { flat } from "stratum/helpers/flat";

// export async function loadClasses(dir: DirInfo): Promise<ProjectClassLibrary> {
//     const clsFiles = await dir.classes();
//     const clsProtos = await Promise.all(clsFiles.map((c) => ClassProto.fromFile(c.file)));
//     return new ProjectClassLibrary(clsProtos.filter((c): c is ClassProto => c !== null));
// }

// export async function loadClasses2(classDirs: Set<DirInfo>): Promise<ProjectClassLibrary> {
//     // 2.3) Исключаем ошибки рекурсивного сканирования имиджей (т.е. если дирректория содержит субдерикторию, вторая удаляется)
//     // for (const c of classDirs) {
//     //     for (let s = c; s.path !== s.dir("..").path; s = s.dir("..")) if (classDirs.has(c.parent)) classDirs.delete(c);
//     // }

//     const dirs = [...classDirs];
//     console.log(`Пути поиска имиджей:\n${dirs.map((d) => d.path).join(";\n")}`);

//     // 2.4) Загружаем имиджи из выбранных директорий.
//     const clsFiles = flat(dirs.map((c) => [...c.search(/.+\.cls$/i)]));
//     const clsProtos = await Promise.all(clsFiles.map((f) => readFile(f, "cls")));
//     console.log(`Загружено ${clsFiles.length} имиджей объемом ${(clsProtos.reduce((a, b) => a + b.byteSize, 0) / 1024).toFixed()} КБ`);
//     return new ProjectClassLibrary(clsProtos);
// }

// export async function loadProject(prjFile: FileInfo): Promise<ProjectResources> {
//     const workDir = prjFile.parent;
//     console.log(`Открываем проект ${prjFile.path}`);
//     const prjInfo = await readFile(prjFile, "prj");

//     let classes: ProjectClassLibrary;
//     // 2) Загружаем имиджи
//     {
//         const classDirs = new Set([workDir]);
//         // 2.1) Разбираем пути поиска имиджей, которые через запятую прописаны в настройках проекта.
//         const settingsPaths = prjInfo.settings?.classSearchPaths;
//         if (settingsPaths) {
//             //prettier-ignore
//             const pathsSeparated = settingsPaths.split(",").map((s) => s.trim()).filter((s) => s);
//             for (const path of pathsSeparated) {
//                 const resolved = workDir.get(path);
//                 if (resolved?.dir) classDirs.add(resolved);
//             }
//         }

//         classes = await loadClasses(classDirs);
//     }

//     // 3) Загружаем STT файл.
//     let stt: VariableSet | undefined;
//     {
//         const sttFile = workDir.get("_preload.stt");
//         if (sttFile && !sttFile.dir) {
//             try {
//                 stt = await sttFile.readAs("stt");
//             } catch (e) {
//                 console.warn(e.message);
//             }
//         }
//     }

//     // 4) Возвращаем результат
//     return { dir: workDir, prjInfo, classes, stt };
// }
