import {z} from "zod";

export enum QuestionType {
    GRID = "grid",
    TEXT = "text"
}

export enum ElemType {
    QUESTION = "question",
    PARAGRAPH = "paragraph",
    HEADING = "heading"
}

export enum TemplateType {
    PRIVATE = 'private',
    PUBLIC = 'paragraph',
    OFFICIAL = 'public'
}

export const answerSchema = z.object({
    type: z.enum(QuestionType)
});

export const gridAnswerSchema = answerSchema.extend({
    type: z.literal(QuestionType.GRID),
    choices: z.array(z.number())
});

export const textAnswerSchema = answerSchema.extend({
    type: z.literal(QuestionType.TEXT),
    text: z.string()
});

export const answerSchemaUnion = z.discriminatedUnion("type",
    [gridAnswerSchema, textAnswerSchema])

export const submissionSchema = z.object({
    answers: z.array(answerSchemaUnion)
});

export const formElementSchema = z.object({
    elemType:z.enum(ElemType)
})

export const paragraphSchema = formElementSchema.extend({
    elemType:z.literal(ElemType.PARAGRAPH),
    text:z.string()
})

export const headingSchema = formElementSchema.extend({
    elemType:z.literal(ElemType.HEADING),
    text:z.string(),
    number:z.int()
})

export const questionSchema = formElementSchema.extend({
    elemType:z.literal(ElemType.QUESTION),
    text: z.string(),
    questionType: z.enum(QuestionType),
    isOptional: z.boolean()
});

export const gridQuestionSchema = questionSchema.extend({
    isMultipleChoice: z.boolean(),
    questionType: z.literal(QuestionType.GRID),
    choices: z.array(z.string())
});

export const textQuestionSchema = questionSchema.extend({
    maxChars: z.coerce.number(),
    questionType: z.literal(QuestionType.TEXT)
});

export const questionUnion = z.discriminatedUnion(
    "questionType", [gridQuestionSchema, textQuestionSchema])

export const formElementUnion = z.discriminatedUnion(
    "elemType", [questionUnion, paragraphSchema, headingSchema])

const baseFormSchema = z.object({
    name: z.string(),
    id: z.string(),
    ownerId: z.string(),
    dateCreated: z.coerce.date().nullable(),
    dateOpened: z.coerce.date().nullable(),
    dateClosed: z.coerce.date().nullable()
})

export const formSchema = baseFormSchema.extend({
    elements: z.array(formElementUnion),
    submissions: z.array(submissionSchema).nullable()
});

export const formSummarySchema = baseFormSchema.extend({
    subCount: z.number()
});

export const newFormSchema = z.object({
    name: z.string(),
    elements: z.array(formElementUnion)
});

export const newTemplateSchema = z.object({
    name: z.string(),
    elements: z.array(formElementUnion)
})

const baseTemplateSchema = z.object({
    id:z.string(),
    name:z.string(),
    ownerId:z.string(),
    status:z.enum(TemplateType)
})

export const templateSchema = baseTemplateSchema.extend({
    elements:z.array(questionUnion),
})

export const templateSummarySchema = baseTemplateSchema.extend({
    questionCount:z.number(),
})

export const questionStatisticSchema = z.object({
    engagement:z.number(),
    type:z.enum(QuestionType)
})

export const textQuestionStatisticSchema = questionStatisticSchema.extend({
    type:z.literal(QuestionType.TEXT),
    avgWordCount:z.number(),
    frequentWords:z.array(z.string())
})

export const gridQuestionStatisticSchema = questionStatisticSchema.extend({
    type:z.literal(QuestionType.GRID),
    answerRate:z.array(z.number())
})

export const questionStatisticSchemaUnion = z.discriminatedUnion(
    "type", [textQuestionStatisticSchema, gridQuestionStatisticSchema])


export const gridChoiceSchema = z.object({
    text:z.string()
})

export const gridOptionsSchema = z.object({
    isMultipleChoice:z.boolean(),
    questionType:z.literal(QuestionType.GRID),
    choices:z.array(gridChoiceSchema)
})

export const textOptionsSchema = z.object({
    questionType:z.literal(QuestionType.TEXT),
    maxChars:z.int()
})

export const questionOptionsSchema = z.object({
    text:z.string(),
    isOptional:z.boolean(),
    specificOptions:z.discriminatedUnion("questionType",[gridOptionsSchema, textOptionsSchema])
})