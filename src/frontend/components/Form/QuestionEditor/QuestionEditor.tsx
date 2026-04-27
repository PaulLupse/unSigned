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
import FormInputErrorPopup from "../../../common/error-popups";

import {gridQuestionSchema, textQuestionSchema} from "../../../domain/schemas";

interface QuestionOptionsComponentProps {
    register:UseFormRegister<QuestionOptions>
    watch:UseFormWatch<QuestionOptions>
    control:Control<QuestionOptions>
    errors:FieldErrors<QuestionOptions>
}

interface QuestionEditorProps {
    setQuestionToBeEdited:(questionIndex:number, set:boolean)=>void
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
                <input data-tooltip-id={'maxChars'}
                       {...props.register("specificOptions.maxChars",
                           {max:
                                   {value:10000,
                                       message:"Answers should not have more than 10000 characters!"}
                           })} defaultValue={30}  type={'number'} />
                <FormInputErrorPopup name={"maxChars"} errors={props.errors} place={'top'} />
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


function getDefaultQuestionOptions(questionData:TextQuestion|GridQuestion):QuestionOptions {

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
        text:questionData.text,
        isOptional:questionData.isOptional,
        specificOptions:specificOptions
    }
}

// Componenta ce ofera posibilitatea de a creea o noua intrebare sau de a edita o intrebare existenta
export function QuestionEditor(props:QuestionEditorProps) {

    // aceasta componenta este si ea un formular a carui folosire creeaza o noua intrebare
    // de fapt, si editarea se realizeaza sub forma de creare a unei intrebari noi, prin inlocuirea optiunilor
    // optiunilor intrebarii cu noi opriuni
    const {register, formState:{errors}, control, watch, getValues, trigger} = useForm<QuestionOptions>(
        { defaultValues:props.questionData?getDefaultQuestionOptions(props.questionData):{},
            mode: "onChange"
        }
    );

    const type = watch('specificOptions.type');

    // handler pentru adaugarea unei noi intrebari
    const submit = async (data:QuestionOptions)=>{

        let question;
        if(data.specificOptions.type==='grid') {
            question =
                gridQuestionSchema.parse({
                    text:data.text,
                    type:'grid',
                    choices:data.specificOptions.choices.map((choice:GridChoice) => choice.text),
                    isOptional:data.isOptional,
                    isMultipleChoice:data.specificOptions.isMultipleChoice
                })
        }
        else {

            question = textQuestionSchema.parse({
                    text:data.text,
                    type:'text',
                    isOptional:data.isOptional,
                    maxChars:data.specificOptions.maxChars
                })
        }
        props.action(props.questionIndex, question);
    };

    return (
        <div className={'question-editor'} id="QuestionEditor">

            <div className={'common-options-frame'}>
                <textarea id="question"
                          aria-setsize={0}
                          data-tooltip-id={'text'}
                          {...register("text",
                              {required:"Question text cannot be null."})}
                          placeholder="Question text"/>

                <FormInputErrorPopup name={'text'} errors={errors} place={"bottom"}/>

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
                            }}
                        style={{width:'8rem'}}>Cancel</button>

                <button type={"button"}
                        onClick=
                            {async()=>{
                                const isValid = await trigger();
                                if (isValid) {
                                    await submit(getValues());
                                    props.setQuestionToBeEdited(props.questionIndex, false);
                                }
                            }}
                        style={{width:'8rem'}}>Done</button>
            </div>
        </div>
    )
}