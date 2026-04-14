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

export interface Answer {
    type:'grid'|'text'
}

export interface GridAnswer extends Answer {
    type:'grid'
    choices:Array<number>
}

export interface TextAnswer extends Answer {
    type:'text'
    text:string
}

export interface Submission {
    answers:Array<GridAnswer|TextAnswer>
}

export interface FormQuestion {
    text:string
    type:'text'|'grid'
    isOptional:boolean
}

export interface GridQuestion extends FormQuestion{
    isMultipleChoice:boolean
    type:'grid'
    choices:Array<string>
}

export interface TextQuestion extends FormQuestion{
    maxChars:number
    type:'text'
}

export interface FormInfo {
    name:string
    id:string
    questions:Array<TextQuestion|GridQuestion>
    dateCreated:Date|null
    datePublished:Date|null
    dateClosed:Date|null
    submissions:Array<Submission>|null
}

export interface MinimalFormInfo {
    name:string
    id:string
    dateCreated:Date|null
    datePublished:Date|null
    dateClosed:Date|null
    submissionsCount:number
}

export interface NewForm {
    name:string,
    questions:Array<TextQuestion|GridQuestion>
}

export interface Credentials {
    username:string
    password:string
}

export interface Email {
    email:string
}