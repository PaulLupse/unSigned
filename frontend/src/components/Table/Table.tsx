import React from "react";
import {getValue, validateKey} from "../../utilities/Utilities";
import type {pair} from "../../utilities/Utilities";
import './table.css'

// model de data pentru a se folosi impreuna cu TableView
export class TableModel {
    private data:Array<any>
    private fieldNumber:number
    private fieldTypes:Array<string>

    constructor(fieldNumber:number, fieldTypes?:Array<string>|undefined) {
        this.data = new Array<any>;
        this.fieldNumber = fieldNumber;

        if(fieldTypes) {
            if(fieldNumber != fieldTypes.length)
                throw new Error("Argument fieldTypes must have a length equal to the one passed in argument fieldNumber.")

            this.fieldTypes = fieldTypes
        }
        else {
            this.fieldTypes = new Array<string>
            for(let i = 0; i < fieldNumber; i++)
                this.fieldTypes.push("any");
        }
    }

    private validateEntry(line:any) {

        if(Object.keys(line).length != this.fieldNumber)
            throw new Error("Line has an invalid number of elements");

        let i:number = 0;
        for(let entry of Object.entries(line)) {
            if (typeof (entry) !== this.fieldTypes[i])
                throw new Error(`Line field number ${i} has invalid element type.`)
        }
    }

    public add(index:number, line:any):void {

        if(index < this.data.length || index >= this.data.length)
            throw new Error("Invalid index.")

        this.validateEntry(line);

        this.data.splice(index, 0, line);
    }

    public remove(index:number):void {
        if(index < this.data.length || index >= this.data.length)
            throw new Error("Invalid index.")

        this.data.splice(index, 1);
    }

    public pushFront(line:any):void {
        this.validateEntry(line);
        this.data.push(line);
    }

    public pushBack(line:any):void {
        this.validateEntry(line);
        this.data.unshift(line);
    }

    public popBack(line:any):void {
        this.data.shift();
    }

    public popFront(line:any):void {
        this.data.pop();
    }

    public getData():Array<any> {
        return this.data;
    }

}

interface TableRowProps<lineInterface extends Object> {
    index:number
    onClick:(arg:lineInterface)=>void
    line:lineInterface
    dataFields: Array<string| pair<string, (arg:any)=>any>>
}

function TableRow<lineInterface extends Object>({index, onClick, line, dataFields}:TableRowProps<lineInterface>) {
    return (
        <tr key={index} onClick={()=>{onClick(line);}}>
            {
                dataFields.map(
                    (entry:string|pair<string, (arg:any)=>any>, index:number)=> {
                        console.log(entry)
                        return (
                            <td key={index} style={{maxWidth:'200px'}}>
                                <p>
                                {
                                    // daca entry-ul e doar un stringm se verifica daca este valid
                                    typeof entry === 'string'?
                                        validateKey(entry, line)?
                                            line[entry as keyof lineInterface]
                                            :''
                                    :
                                        validateKey(entry.obj1, line)?
                                            entry.obj2(line[entry.obj1 as keyof lineInterface])
                                            :''

                                }
                                </p>
                            </td>
                        )
                    }
                )
            }
        </tr>
    )
}

// Interfata generica pentru componenta Table. Tipul 'lineInterface' reprezinta tipul elementelor vectorului de date.
// Ia ca parametru numele coloanelor, datele ce trebuie sa populeze tabela si un
// sir de chei pentru accesarea campurilor din obiectele de tip lineInterface. Pe langa cheie se poate pasa si
// o functie, ce realizeaza o prelucrare asupra datelor campului inainte de afisarea acestora in tabel
interface TableProps<lineInterface extends Object> {
    columns: Array<string>
    data: Array<lineInterface>
    columnNames: Array<string| pair<string, (arg:any)=>any>>
    rowOnClick: (arg1:lineInterface)=>void
    style?: any
}

export function Table<lineInterface extends Object>(props:TableProps<lineInterface>) {

    return (
        <table style={props.style?props.style:{}}>
            <thead>
            <tr>
                {
                    props.columns.map(
                        function mapFunction(columnName:string, columnIndex:number) {
                            return (
                                <th key={columnIndex}>
                                    {columnName}
                                </th>
                            );
                        }
                    )
                }
            </tr>

            </thead>
            <tbody>
            {
                props.data.map(
                    (line:lineInterface, index:number)=>{
                        return (
                            <TableRow index={index} onClick={props.rowOnClick} line={line} dataFields={props.columnNames} />
                        )
                    }
                )
            }
            </tbody>
        </table>
    )
}