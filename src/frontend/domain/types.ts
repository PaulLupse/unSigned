import React from "react";
import type {FieldArrayWithId, FieldErrors, UseFormRegister} from "react-hook-form";

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

export interface Question {
    text:string
    type:'text'|'grid'
    isOptional:boolean
}

export interface GridQuestion extends Question{
    isMultipleChoice:boolean
    type:'grid'
    choices:Array<string>
}

export interface TextQuestion extends Question{
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

export interface Template {
    id: string
    name: string
    questions:Array<TextQuestion|GridQuestion>
    ownerId: string
}

export interface MinimalTemplate {
    id:string
    name:string
    questionCount:number
    ownerId:string
}

export interface Credentials {
    username:string
    password:string
}

export interface Email {
    email:string
}

export interface NewForm {
    name:string
    questions:Array<TextQuestion|GridQuestion>
}

export interface GridChoice {
    text:string
}

export interface GridOptions{
    isMultipleChoice:boolean
    type:'grid'
    choices:GridChoice[]
}

export interface TextOptions{
    type:'text'
    maxChars:number
}

export interface QuestionOptions {
    text:string
    isOptional:boolean
    specificOptions:GridOptions|TextOptions
}

interface AnswerStatistic {
    type:'text'|'grid'
    engagement:number
}

export interface TextQuestionAnswerStatistic extends AnswerStatistic {
    type:'text'
    avgWordCount:number
    frequentWords:string[]
}

export interface GridQuestionAnswerStatistic extends AnswerStatistic {
    type:'grid'
    answerRate:number[]
}

export interface User {
    username:string
    id:string
}