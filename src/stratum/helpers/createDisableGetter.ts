import { ClassState } from "vm-interfaces-base";

export function createDisableGetter(ci: ClassState): () => boolean {
    const enableVarid = ci.getVarIdLowCase("_enable");
    const disableVarId = ci.getVarIdLowCase("_disable");

    let res = () => false;

    if (enableVarid !== undefined) res = () => ci.getNewVarValue(enableVarid) < 1;

    if (disableVarId !== undefined) {
        const disableVarPriority = enableVarid === undefined || disableVarId < enableVarid;
        if (disableVarPriority) res = () => ci.getNewVarValue(disableVarId) > 0;
    }

    return res;
}
