import { ClassProto } from "stratum/common/classProto";
import { VarCode } from "stratum/common/varCode";
import { ClassLink } from "stratum/fileFormats/cls";
import { BadDataError } from "stratum/helpers/errors";
import { NodeCode } from "./nodeCode";
import { PlacementDescription, Schema } from "./schema";

function applyLinks(node: Schema, links: ClassLink[]) {
    const warn = (msg: string) => console.warn(`Имидж ${node.protoName}: ${msg}`);

    for (const { handle1, handle2, connectedVars } of links) {
        // Получаем соединяемые объекты
        const first = handle1 === 0 ? node : node.getChild(handle1);
        const second = handle2 === 0 ? node : node.getChild(handle2);

        if (!first) warn(`Подимидж #${handle1} не найден`);
        else if (!first.proto.vars) warn(`Подимидж #${handle1} не имеет переменных`);
        if (!second) warn(`Подимидж #${handle2} не найден`);
        else if (!second.proto.vars) warn(`Подимидж #${handle2} не имеет переменных`);

        if (!first || !first.proto.vars || !second || !second.proto.vars) continue;

        const firstVars = first.proto.vars;
        const secondVars = second.proto.vars;

        const obj1Name = `подимидже ${first.protoName} #${handle1}`;
        const obj2Name = `подимидже ${second.protoName} #${handle2}`;

        // Соединяем каждую пару переменных этих объектов.
        for (const { name1, name2 } of connectedVars) {
            const varId1 = firstVars.varNameToId.get(name1.toLowerCase());
            const varId2 = secondVars.varNameToId.get(name2.toLowerCase());

            if (varId1 === undefined) warn(`Переменная ${name1} не найдена в ${obj1Name}`);
            if (varId2 === undefined) warn(`Переменная ${name2} не найдена в ${obj2Name}`);
            if (varId1 === undefined || varId2 === undefined) continue;

            if (!Schema.connectVar(first, varId1, second, varId2)) {
                const typeFirst = VarCode[first.proto.vars.typeCodes[varId1]];
                const typeSecond = VarCode[second.proto.vars.typeCodes[varId2]];
                warn(`Не удалось соединить ${name1} (${typeFirst}) в ${obj1Name} и ${name2} (${typeSecond}) в ${obj2Name}`);
            }
        }
    }
}

/**
 * Рекурсивно создает дерево имиджей.
 * @param protoName - имя прототипа имиджа;
 * @param classes - коллекция имиджей;
 * @param placement - описание размещения имиджа на схеме родительского имиджа.
 */
function buildSchemaRecursive(protoName: string, classes: Map<string, ClassProto<NodeCode>>, placement?: PlacementDescription): Schema {
    const proto = classes.get(protoName.toLowerCase());
    if (!proto) throw new BadDataError(`Имидж ${protoName} не найден`);

    //Создаем текущий узел дерева.
    const node = new Schema({ proto, placement });

    //Создаем детей.
    if (proto.children) {
        const children = proto.children.map((child) => {
            return buildSchemaRecursive(child.classname, classes, {
                parent: node,
                ...child.schemeInfo,
            });
        });
        node.setChildren(children);
    }

    //Проводим связи между дочерними узлами и текущим узлом.
    if (proto.links) {
        applyLinks(node, proto.links);
    }

    return node;
}

/**
 * Создает дерево вычисляемых имиджей и проводит связи между ними.
 */
export function build(rootClassName: string, classes: Map<string, ClassProto<NodeCode>>) {
    return buildSchemaRecursive(rootClassName, classes);
}
