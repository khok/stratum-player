export class MemoryManager {
    private defaultVars: (string | number)[];
    private oldVars: (string | number)[];
    private newVars: (string | number)[];
    constructor(public readonly varCount: number) {
        this.oldVars = new Array(varCount);
        this.newVars = new Array(varCount);
        this.defaultVars = new Array(varCount);
    }

    assertDefaultValuesInitialized() {
        for (let i = 0; i < this.defaultVars.length; i++)
            if (this.defaultVars[i] === undefined) throw new Error(`Переменная ${i} не инициализирована`);
    }

    initValues() {
        this.oldVars = this.defaultVars.slice();
        this.newVars = this.defaultVars.slice();
    }
    syncValues() {
        this.oldVars = this.newVars.slice();
    }
    isValueInitialized(id: number) {
        //TODO: сделать лучше
        return this.defaultVars[id] !== undefined;
    }
    setDefaultVarValue(id: number, value: string | number): void {
        this.defaultVars[id] = value;
    }
    getDefaultVarValue(id: number): string | number {
        return this.defaultVars[id];
    }
    setNewVarValue(id: number, value: string | number): void {
        this.newVars[id] = value;
    }
    setOldVarValue(id: number, value: string | number): void {
        this.oldVars[id] = value;
    }
    getNewVarValue(id: number): string | number {
        return this.newVars[id];
    }
    getOldVarValue(id: number): string | number {
        return this.oldVars[id];
    }
}
