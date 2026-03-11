import React from "react";
import type {Item} from "../user/back-end-connection";
import getValues from "./Utilities";

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


// componenta Table ia ca parametrii numele coloanelor, modelul (care retine datele) si, optional, stilul pt
// tabela
interface TableProps<lineInterface> {
    columns: Array<string>
    data: Array<lineInterface>
    style?: any
}

export function Table<lineInterface>(props:TableProps<lineInterface>) {

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
                            <tr key={index}>
                                {
                                    getValues(line).map(
                                        (entry:any, index:number)=> {
                                            return (
                                                <td key={index}>
                                                    {entry}
                                                </td>
                                            )
                                        }
                                    )
                                }
                            </tr>
                        )
                    }
                )
            }
            </tbody>
        </table>
    )
}