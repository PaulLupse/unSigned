import React from "react";

export class LoginInfo {
    private _username;
    private _password;

    constructor(username:string, password:string) {
        this._username = username;
        this._password = password;

        Object.seal(this);
        Object.preventExtensions(this);
    }

    public get username() { return this._username; }
    public get password() { return this._password; }
}

export interface GridAnswer {
    choices:Array<number>
}

export interface TextAnswer {
    text:string
}

export interface Submission {
    answers:Array<GridAnswer|TextAnswer>
}

export interface FormQuestion {
    text:string
    isOptional:boolean
}

export interface GridQuestion extends FormQuestion{
    isMultipleChoice:boolean
    choices:Array<string>
}

export interface TextQuestion extends FormQuestion{
    maxChars:number
}


export class FormQuestion implements FormQuestion{
    constructor(text:string, isOptional:boolean) {
        this.text = text;
        this.isOptional = isOptional;
    }
}

export class GridQuestion extends FormQuestion implements GridQuestion {
    isMultipleChoice:boolean=false
    choices:Array<string>=new Array<string>
    constructor(text:string, isOptional:boolean, isMultipleChoice:boolean, choices:Array<string>) {
        super(text, isOptional);
        this.isMultipleChoice = isMultipleChoice;
        this.choices = choices;
    }
}

export class TextQuestion extends FormQuestion  implements TextQuestion {
    maxChars:number=30

    constructor(text:string, isOptional:boolean, maxChars:number) {
        super(text, isOptional);
        this.maxChars = maxChars
    }

}

export interface FormInfo {
    name:string
    questions:Array<TextQuestion|GridQuestion>
    dateCreated:Date|null
    dateUpdated:Date|null
    submissions:Array<Submission>|null
}

export class FormInfo implements FormInfo {
    constructor(name:string, questions:Array<any>, dateCreated?:Date|null, dateUpdated?:Date|null, submissions?:Array<Submission>|null) {
        this.name = name

        this.questions = new Array<TextQuestion|GridQuestion>
        for(let question of questions) {
            if(Object.hasOwn(question, 'isMultipleChoice'))
                this.questions.push(new GridQuestion(question.text, question.isOptional, question.isMultipleChoice, question.choices))
            else this.questions.push(new TextQuestion(question.text, question.isOptional, question.maxChars))
        }

        this.dateCreated = dateCreated?dateCreated:null
        this.dateUpdated = dateUpdated?dateUpdated:null
        this.submissions = submissions?submissions:null
    }
}