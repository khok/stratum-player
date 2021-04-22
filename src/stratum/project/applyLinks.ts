import { VarType } from "stratum/common/varType";
import { ClassLinkInfo } from "stratum/fileFormats/cls";
import { Schema } from "./schema";

export function applyLinks(node: Schema, links: ClassLinkInfo[]) {
    const warn = (msg: string) => console.warn(`Имидж ${node.proto.name}: ${msg}`);

    for (const { handle1, handle2, flags, connectedVars } of links) {
        const isDisabled = flags & 1;
        // Получаем соединяемые объекты
        const first = handle1 === 0 ? node : node.child(handle1);
        if (!first) {
            warn(`Подимидж #${handle1} не найден`);
            continue;
        }
        const second = handle2 === 0 ? node : node.child(handle2);
        if (!second) {
            warn(`Подимидж #${handle2} не найден`);
            continue;
        }

        const firstVars = first.proto.vars();
        const secondVars = second.proto.vars();

        const obj1Name = `подимидже ${first.proto.name} #${handle1}`;
        const obj2Name = `подимидже ${second.proto.name} #${handle2}`;

        // Соединяем каждую пару переменных этих объектов.
        for (const { name1, name2 } of connectedVars) {
            const varId1 = firstVars.id(name1);
            const varId2 = secondVars.id(name2);

            if (typeof varId1 !== "number") {
                warn(`Переменная ${name1} не найдена в ${obj1Name}`);
                continue;
            }
            if (typeof varId2 !== "number") {
                warn(`Переменная ${name2} не найдена в ${obj2Name}`);
                continue;
            }

            if (!first.connectVar(varId1, second, varId2, isDisabled)) {
                const typeFirst = VarType[firstVars.data(varId1).type];
                const typeSecond = VarType[secondVars.data(varId1).type];
                warn(`Не удалось соединить ${name1} (${typeFirst}) в ${obj1Name} и ${name2} (${typeSecond}) в ${obj2Name}`);
            }
        }
    }
}
