
export default function getValues<type>(obj:type):Array<any> {
    const values:Array<any> = new Array<any>();
    for(let key in obj)
        values.push(obj[key]);
    return values;
}