import type {Credentials} from "src/auth/types";

// Wrapper care funcționează ca shorthand pentru log
export const log = (any:any) => console.log(any)

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

export function getValue<type>(obj:type, keyInObj:string):any {
    for(let key in obj)
        if(key===keyInObj)
            return obj[key]
    return null;
}

export class CustomError extends Error {
    public status:number;
    constructor(message:string, status:number) {
        super(message);
        this.status = status;
    }
}

export class CredentialError extends Error {

    public detail:Credentials;
    public status:number;
    constructor(message:string, detail:Credentials, status:number) {
        super(message);
        this.detail = detail;
        this.status = status
    }
}


// Se ocupa de raspunsurile cu anumite coduri de status (orice in afara de cele din intervalul 200-299),
// sau raspunsuri cu status neprevazut, prin crearea unor erori cu mesaje generale.
export function handleGenericErrorResponses(response:Response) {
    if (response.status == 429)
        throw new CustomError("Slow down! (you are being rate limited)", 429)

    if(response.status == 401)
        throw new CustomError("Please log in first.", 401)

    if(response.status == 403)
        throw new CustomError("You are not authorized to perform that action.", 403)

    if(response.status == 500)
        throw new CustomError("Internal backend-connection error.", 500)


    throw new CustomError("Something went wrong . . .", 500)
}


