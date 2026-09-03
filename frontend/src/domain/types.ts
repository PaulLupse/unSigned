import {z} from "zod";
import {
    answerSchema, answerStatisticSchema, credentialsSchema, emailSchema, formInfoSchema, formQuestionSchema,
    gridAnswerSchema, gridChoiceSchema,
    gridOptionsSchema,
    gridQuestionAnswerStatisticSchema, gridQuestionSchema, minimalFormInfoSchema, minimalTemplateSchema, newFormSchema,
    questionOptionsSchema,
    type registerData,
    submissionSchema, templateSchema,
    textAnswerSchema, textOptionsSchema, textQuestionAnswerStatisticSchema, textQuestionSchema,
    userDataWithStatsSchema, userSchema, userStatsSchema
} from "src/domain/schemas";

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


export type Answer = z.infer<typeof answerSchema>
export type GridAnswer = z.infer<typeof gridAnswerSchema>
export type TextAnswer = z.infer<typeof textAnswerSchema>
export type Submission = z.infer<typeof submissionSchema>
export type Question = z.infer<typeof formQuestionSchema>
export type GridQuestion = z.infer<typeof gridQuestionSchema>
export type TextQuestion = z.infer<typeof textQuestionSchema>
export type FormInfo = z.infer<typeof formInfoSchema>
export type MinimalFormInfo = z.infer<typeof minimalFormInfoSchema>
export type Template = z.infer<typeof templateSchema>
export type MinimalTemplate = z.infer<typeof minimalTemplateSchema>
export type Credentials = z.infer<typeof credentialsSchema>
export type Email = z.infer<typeof emailSchema>
export type NewForm = z.infer<typeof newFormSchema>
export type GridChoice = z.infer<typeof gridChoiceSchema>
export type GridOptions = z.infer<typeof gridOptionsSchema>
export type TextOptions = z.infer<typeof textOptionsSchema>
export type QuestionOptions = z.infer<typeof questionOptionsSchema>
export type AnswerStatistic = z.infer<typeof answerStatisticSchema>
export type TextQuestionAnswerStatistic = z.infer<typeof textQuestionAnswerStatisticSchema>
export type GridQuestionAnswerStatistic = z.infer<typeof gridQuestionAnswerStatisticSchema>
export type User = z.infer<typeof userSchema>
export type UserStats = z.infer<typeof userStatsSchema>
export type UserDataWithStats = z.infer<typeof userDataWithStatsSchema>
export type RegisterData = z.infer<typeof registerData>
