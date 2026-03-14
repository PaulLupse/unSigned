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
    answer:string
}

export interface Submission {
    answers:Array<GridAnswer|TextAnswer>
}

export class FormQuestion {
    text:string=''
    isOptional:boolean=false
    constructor(text:string, isOptional:boolean) {
        this.text = text;
        this.isOptional = isOptional;
    }
}

export class GridQuestion extends FormQuestion {
    isMultipleChoice:boolean=false
    choices:Array<string>=new Array<string>
    constructor(text:string, isOptional:boolean, isMultipleChoice:boolean, choices:Array<string>) {
        super(text, isOptional);
        this.isMultipleChoice = isMultipleChoice;
        this.choices = choices;
    }
}

export class TextQuestion extends FormQuestion {
    maxCharacters:number=30

    constructor(text:string, isOptional:boolean, maxChars:number) {
        super(text, isOptional);
        this.maxCharacters = maxChars
    }

}

export interface FormInfo {
    name:string
    questions:Array<TextQuestion|GridQuestion>
    dateCreated:Date|null
    dateUpdated:Date|null
    submissions:Array<Submission>|null
    key:string
}

export class FormInfo implements FormInfo {
    constructor(name:string, questions:Array<TextQuestion|GridQuestion>, key:string, dateCreated?:Date|undefined, dateUpdated?:Date|undefined, submissions?:Array<Submission>|undefined) {
        this.name = name
        this.questions = questions
        this.dateCreated = dateCreated?dateCreated:null
        this.dateUpdated = dateUpdated?dateUpdated:null
        this.submissions = submissions?submissions:null
        this.key = key
    }
}