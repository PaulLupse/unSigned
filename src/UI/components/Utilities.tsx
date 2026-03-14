import type {FormInfo} from "../domain/types";

export interface pair<type1, type2> {
    obj1:type1
    obj2:type2
}

export class pair<type1, type2> implements pair<type1, type2> {
    constructor(obj1:type1, obj2:type2) {
        this.obj1 = obj1;
        this.obj2 = obj2
    }
}

export function makePair(arg1:any, arg2:any):pair<any, any> {
    return new pair<typeof arg1, typeof arg2>(arg1, arg2);
}

export function validateKey(key:string, obj:any):boolean {
    for(let k in obj) {
        if (k === key)
            return true
    }
    return false
}

export  function getValues<type>(obj:type):Array<any> {
    const values:Array<any> = new Array<any>();
    for(let key in obj)
        values.push(obj[key]);
    return values;
}