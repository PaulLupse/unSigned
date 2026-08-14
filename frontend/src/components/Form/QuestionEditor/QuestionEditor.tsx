import React, {type SetStateAction} from "react";
import type {Dispatch} from "react";
import {
    useForm,
    type UseFormRegister,
    type UseFormWatch,
    type FieldErrors,
    useFieldArray,
    type Control,
    type FieldArrayWithId,
} from "react-hook-form";


import type {
    TextQuestion,
    GridQuestion,
    QuestionOptions,
    GridChoice,
    GridOptions, TextOptions
} from "../../../domain/types";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";

import {gridQuestionSchema, textQuestionSchema} from "../../../domain/schemas";

interface QuestionOptionsComponentProps {
    register:UseFormRegister<QuestionOptions>
    watch:UseFormWatch<QuestionOptions>
    control:Control<QuestionOptions>
    errors:FieldErrors<QuestionOptions>
}

interface QuestionEditorProps {
    setQuestionToBeEdited:(questionIndex:number, set:boolean)=>void
    setQuestionNew:(questionIndex:number, set:boolean)=>void
    questionIsNew:(questionIndex:number)=>boolean
    deleteQuestion:(questionIndex:number)=>void
    action:(questionIndex:number, question:GridQuestion|TextQuestion)=>void;
    questionIndex:number
    questionData?:TextQuestion|GridQuestion
}

interface GridQuestionChoiceComponentProps {
    option:FieldArrayWithId<QuestionOptions, 'specificOptions.choices', 'id'>
    register:UseFormRegister<QuestionOptions>
    index:number
    errors:FieldErrors<QuestionOptions>
    removeChoice:(optionIndex:number)=>void
}

// Componenta menita pentru afisarea optiunilor intrebarilor de tip text.
function TextQuestionOptions(props:QuestionOptionsComponentProps) {
    return (
        <div className={'text-question'}>

            <div className={'is-optional'}>
                <input {...props.register("isOptional")} type='checkbox'/>
                <label>Optional</label>
            </div>

            <div className={'max-chars'}>
                <label>
                    Maximum characters:
                </label>
                <input data-tooltip-id={'specificOptions.maxChars'}
                       {...props.register("specificOptions.maxChars",
                           {max: {value:10000,
                                       message:"Answers should not have more than 10000 characters!"}
                           })} defaultValue={30}  type={'number'} />
                <FormInputErrorPopup name={"specificOptions.maxChars"} errors={props.errors} place={'top'} />
            </div>
        </div>
    )
}

// Componenta creata pentru a afisa caseta de introducere a unei variante de raspuns al intrebarii grila
function GridQuestionChoiceComponent ({option, register, removeChoice, index, errors}:GridQuestionChoiceComponentProps) {
    return (
        <li key={option.id} >
            <div >
                <input defaultValue={`Choice #${index}`} {...register(`specificOptions.choices.${index}.text`,
                        {required:'Option cannot be null.'})}
                       data-tooltip-id={`choices.${index}.text`}
                        type={'text'}/>

                <FormInputErrorPopup name={`choices.${index+1}.text`} errors={errors} place={'left'} />

                <button type="button" onClick={()=>{removeChoice(index)}}>
                    -
                </button>
            </div>
        </li>
    )
}

// Componenta menita pentru afisarea optiunilor intrebarilor de tip grilă.
function GridQuestionOptions(props:QuestionOptionsComponentProps) {

    // folosim un camp de tip array pentru a inregistra optiunile intrebarii grila
    const {fields, append, remove} = useFieldArray<QuestionOptions>({control:props.control, name:"specificOptions.choices"})

    function addChoice() {
        append({text:''});
    }

    function removeChoice(optionIndex:number) {
        remove(optionIndex);
    }

    return (
        <div className={'grid-question'}>
            <div className={'options-frame'}>
                <div className={'option'}>
                    <input {...props.register("isOptional")} type='checkbox'/>
                    <p>Optional</p>
                </div>

                <div className={'option'}>
                    <input {...props.register("specificOptions.isMultipleChoice")} type='checkbox'/>
                    <p>Multiple choice</p>
                </div>
            </div>
            {
                fields.length>0 &&
                <ol>
                    {
                        fields.map((option, index)=>{
                            return (
                                <GridQuestionChoiceComponent
                                     option={option}
                                     register={props.register}
                                     index={index}
                                     errors={props.errors}
                                     removeChoice={removeChoice} />
                            )
                        })
                    }
                </ol>
            }
            <div className={'add-button-frame'}>
                <button type="button" onClick={addChoice}>
                    Add choice
                </button>
            </div>
        </div>

    )
}


function getDefaultQuestionOptions(questionData:TextQuestion|GridQuestion|undefined, questionIndex:number):QuestionOptions {

    if(questionData) {
         let specificOptions:GridOptions|TextOptions
        if (questionData.type === 'grid') {
             specificOptions = {
                 type:"grid",
                 choices:questionData.choices.map(
                     (choice:string):GridChoice=> {
                         return {text:choice}
                     }),
                 isMultipleChoice: questionData.isMultipleChoice
             }
        } else {
            specificOptions = {
                type:"text",
                maxChars:questionData.maxChars
            }
        }

        return {
            text:questionData.text!==''?questionData.text:`Question #${questionIndex+1} text`,
            isOptional:questionData.isOptional,
            specificOptions:specificOptions
        }
    } return {
        text:`Question #${questionIndex+1} text`,
        isOptional:false,
        specificOptions:{type:'text', maxChars:30}
    }

}

// Componenta ce ofera posibilitatea de a creea o noua intrebare sau de a edita o intrebare existenta
export function QuestionEditor(props:QuestionEditorProps) {

    // aceasta componenta este si ea un formular a carui folosire creeaza o noua intrebare
    // de fapt, si editarea se realizeaza sub forma de creare a unei intrebari noi, prin inlocuirea optiunilor
    // optiunilor intrebarii cu noi opriuni
    const {register, formState:{errors}, control, watch, getValues, trigger} = useForm<QuestionOptions>(
        { values:getDefaultQuestionOptions(props.questionData, props.questionIndex),
            mode: "onChange"
        }
    );

    const type = watch('specificOptions.type');

    // handler pentru adaugarea unei noi intrebari
    const submit = async (data:QuestionOptions)=>{

        let constructedQuestion:any = {text:data.text, isOptional:data.isOptional, type:data.specificOptions.type}, question;
        if(data.specificOptions.type==='grid') {

            constructedQuestion.choices=data.specificOptions.choices.map((choice:GridChoice) => choice.text);
            constructedQuestion.isMultipleChoice=data.specificOptions.isMultipleChoice;
            question = gridQuestionSchema.parse(constructedQuestion)

        } else {
            constructedQuestion.maxChars=data.specificOptions.maxChars;
            question = textQuestionSchema.parse(constructedQuestion)
        }

        props.action(props.questionIndex, question);
    };

    return (
        <div className={'question-editor'} id="QuestionEditor">

            <div className={'common-options-frame'}>
                <textarea id="question"
                          defaultValue={`Question #${props.questionIndex} text . . .`}
                          aria-setsize={0}
                          data-tooltip-id={`text${props.questionIndex}`}
                          {...register("text",
                              {required:"Question text cannot be null."})}
                          placeholder="Question text"/>

                <FormInputErrorPopup id={`text${props.questionIndex}`} name={`text`} errors={errors} place={"bottom"}/>

                {/* selector al tipului de intrebare */}
                <select {...register("specificOptions.type")}>
                    <option value='text'>Text Question</option>
                    <option value='grid'>Grid Question</option>
                </select>
            </div>

            {
                type==='grid' &&
                <GridQuestionOptions register={register} watch={watch} errors={errors} control={control} />
            }
            {
                type==='text' &&
                <TextQuestionOptions register={register} watch={watch} errors={errors} control={control} />
            }

            <div className={'button-bar'}>

                <button type={"button"}
                        onClick={
                            ()=>{
                                props.setQuestionToBeEdited(props.questionIndex, false);
                                if(props.questionIsNew(props.questionIndex)) {
                                    props.deleteQuestion(props.questionIndex);
                                    props.setQuestionNew(props.questionIndex, false)
                                }

                            }}
                        style={{width:'8rem'}}>Cancel</button>

                <button type={"button"}
                        onClick=
                            {async()=>{
                                const isValid = await trigger();
                                if (isValid) {
                                    await submit(getValues());
                                    if (props.questionIsNew(props.questionIndex))
                                        props.setQuestionNew(props.questionIndex, false)
                                    props.setQuestionToBeEdited(props.questionIndex, false);
                                }
                            }}
                        style={{width:'8rem'}}>Done</button>
            </div>
        </div>
    )
}