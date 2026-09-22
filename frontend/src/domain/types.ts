import {z} from "zod";
import {
    formElementUnion,
    formSchema,
    formSummarySchema,
    gridAnswerSchema,
    gridChoiceSchema,
    gridOptionsSchema,
    gridQuestionStatisticSchema,
    gridQuestionSchema, headingSchema,
    newFormSchema, newTemplateSchema, paragraphSchema,
    questionOptionsSchema,
    questionUnion,
    submissionSchema,
    templateSchema,
    templateSummarySchema,
    textAnswerSchema,
    textOptionsSchema,
    textQuestionStatisticSchema,
    textQuestionSchema, questionStatisticSchemaUnion, answerSchemaUnion
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

export type Paragraph = z.infer<typeof paragraphSchema>
export type Heading = z.infer<typeof headingSchema>
export type GridAnswer = z.infer<typeof gridAnswerSchema>
export type TextAnswer = z.infer<typeof textAnswerSchema>
export type AnswerUnion = z.infer<typeof answerSchemaUnion>
export type Submission = z.infer<typeof submissionSchema>
export type GridQuestion = z.infer<typeof gridQuestionSchema>
export type TextQuestion = z.infer<typeof textQuestionSchema>
export type QuestionUnion = z.infer<typeof questionUnion>
export type FormElementUnion = z.infer<typeof formElementUnion>
export type FormInfo = z.infer<typeof formSchema>
export type FormSummary = z.infer<typeof formSummarySchema>
export type Template = z.infer<typeof templateSchema>
export type TemplateSummary = z.infer<typeof templateSummarySchema>
export type NewForm = z.infer<typeof newFormSchema>
export type NewTemplate = z.infer<typeof newTemplateSchema>
export type TextQuestionStatistic = z.infer<typeof textQuestionStatisticSchema>
export type GridQuestionStatistic = z.infer<typeof gridQuestionStatisticSchema>
export type QuestionStatisticUnion = z.infer<typeof questionStatisticSchemaUnion>

// TODO: Elimină nevoia pentru aceste tipuri de date.
export type GridChoice = z.infer<typeof gridChoiceSchema>
export type GridOptions = z.infer<typeof gridOptionsSchema>
export type TextOptions = z.infer<typeof textOptionsSchema>
export type QuestionOptions = z.infer<typeof questionOptionsSchema>