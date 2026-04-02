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


// export class TextAnswer implements TextAnswer {
//     constructor(text:string) {
//         this.text = text;
//     }
// }
//
// export class GridAnswer implements GridAnswer {
//     constructor(choices:number[]) {
//         this.choices = choices;
//     }
// }
//
// export class Submission implements Submission {
//     constructor(answers:Array<TextAnswer|GridAnswer>) {
//         this.answers=new Array<GridAnswer|TextAnswer>
//
//         for(let answer of answers) {
//             if(answer instanceof TextAnswer)
//                 answers.push(new TextAnswer(answer.text))
//             else answers.push(new GridAnswer(answer.choices))
//         }
//     }
// }
//
// export class FormQuestion implements FormQuestion{
//     constructor(text:string, isOptional:boolean) {
//         this.text = text;
//         this.isOptional = isOptional;
//     }
// }
//
// export class GridQuestion extends FormQuestion implements GridQuestion {
//     isMultipleChoice:boolean=false
//     choices:Array<string>=new Array<string>
//     constructor(text:string, isOptional:boolean, isMultipleChoice:boolean, choices:Array<string>) {
//         super(text, isOptional);
//         this.isMultipleChoice = isMultipleChoice;
//         this.choices = choices;
//     }
// }
//
// export class TextQuestion extends FormQuestion  implements TextQuestion {
//     maxChars:number=30
//
//     constructor(text:string, isOptional:boolean, maxChars:number) {
//         super(text, isOptional);
//         this.maxChars = maxChars
//     }
//
// }
//
// export class FormInfo implements FormInfo {
//
//     // ar trebui sa fucntioneze ca un constructor de copiere
//     constructor({name, questions, dateCreated, dateUpdated, _submissions}:{name:string, questions:Array<any>, dateCreated?:Date|null, dateUpdated?:Date|null, _submissions?:Array<Submission>|null}) {
//         this.name = name
//
//         this.questions = new Array<TextQuestion|GridQuestion>
//         for(let question of questions) {
//             if(Object.hasOwn(question, 'isMultipleChoice'))
//                 this.questions.push(new GridQuestion(question.text, question.isOptional, question.isMultipleChoice, question.choices))
//             else this.questions.push(new TextQuestion(question.text, question.isOptional, question.maxChars))
//         }
//
//         this.submissions = new Array<Submission>
//         if(_submissions)
//             for(let submission of _submissions) {
//                 this.submissions.push(new Submission(submission.answers))
//             }
//
//         this.dateCreated = dateCreated?dateCreated:null
//         this.dateUpdated = dateUpdated?dateUpdated:null
//     }
// }