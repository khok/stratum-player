import { ClassLibrary } from "stratum/common/classLibrary";
import { VarType } from "stratum/common/varType";
import { ClassLink } from "stratum/fileFormats/cls";
import { Project } from "./project";
import { PlacementDescription, Schema } from "./schema";

function applyLinks(node: Schema, links: ClassLink[]) {
    const warn = (msg: string) => console.warn(`Имидж ${node.proto.name}: ${msg}`);

    for (const { handle1, handle2, flags, connectedVars } of links) {
        // Получаем соединяемые объекты
        const first = handle1 === 0 ? node : node.child(handle1);
        const second = handle2 === 0 ? node : node.child(handle2);

        if (!first) warn(`Подимидж #${handle1} не найден`);
        else if (!first.proto.vars) warn(`Подимидж #${handle1} не имеет переменных`);
        if (!second) warn(`Подимидж #${handle2} не найден`);
        else if (!second.proto.vars) warn(`Подимидж #${handle2} не имеет переменных`);

        if (!first || !first.proto.vars || !second || !second.proto.vars) continue;

        const firstVars = first.proto.vars;
        const secondVars = second.proto.vars;

        const obj1Name = `подимидже ${first.proto.name} #${handle1}`;
        const obj2Name = `подимидже ${second.proto.name} #${handle2}`;

        // Соединяем каждую пару переменных этих объектов.
        for (const { name1, name2 } of connectedVars) {
            const varId1 = firstVars.nameUCToId.get(name1.toUpperCase());
            const varId2 = secondVars.nameUCToId.get(name2.toUpperCase());

            if (varId1 === undefined) warn(`Переменная ${name1} не найдена в ${obj1Name}`);
            if (varId2 === undefined) warn(`Переменная ${name2} не найдена в ${obj2Name}`);
            if (varId1 === undefined || varId2 === undefined) continue;

            if (!first.connectVar(varId1, second, varId2, flags)) {
                const typeFirst = VarType[first.proto.vars.types[varId1]];
                const typeSecond = VarType[second.proto.vars.types[varId2]];
                warn(`Не удалось соединить ${name1} (${typeFirst}) в ${obj1Name} и ${name2} (${typeSecond}) в ${obj2Name}`);
            }
        }
    }
}

/**
 * Рекурсивно создает дерево имиджей.
 * @param protoName - имя прототипа имиджа;
 * @param lib - коллекция имиджей;
 * @param placement - описание размещения имиджа на схеме родительского имиджа.
 */
export function buildSchema(protoName: string, lib: ClassLibrary, prj: Project, placement?: PlacementDescription): Schema {
    const proto = lib.get(protoName);
    if (!proto) throw Error(`Имидж "${protoName}" не найден.`);

    //Создаем текущий узел дерева.
    const node = new Schema(proto, prj, lib, placement);

    //Создаем детей.
    if (proto.children) {
        const children = proto.children.map((child) => {
            return buildSchema(child.classname, lib, prj, {
                parent: node,
                ...child.schemeInfo,
            });
        });
        node.setChildren(children);
    }

    //Проводим связи между дочерними узлами и текущим узлом.
    if (proto.links) applyLinks(node, proto.links);
    return node;
}
