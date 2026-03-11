
// clasa ce implementeaza o eroare de tip pentru o variabila
// constructorul ia ca parametru variabila, numele acesteia si numele tipului corect
export class SimpleTypeError {
    #message = "";
    constructor(variable:any, variableName:string, expectedTypeName:string) {
        
        this.#message = `Invalid type for variable ${variableName} of type ${typeof(variable)}. Expected ${expectedTypeName}.`;

        Object.seal(this);
        Object.preventExtensions(this);
    }
    toString() {
        return this.#message;
    }
}