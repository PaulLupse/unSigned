import React from "react";
import {type Control, type FieldErrors, useForm, type UseFormRegister, type UseFormWatch,} from "react-hook-form";

import {z} from "zod"
import {zodResolver} from '@hookform/resolvers/zod';

import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";

import {Switch} from "src/components/Switch";
import {ElemType, type MCQuestion, QuestionType, type QuestionUnion, type TextQuestion} from "src/client/types.gen";
import { zGridChoice } from "src/domain/schemas";
import type {GridChoice} from "src/domain/types";

interface QuestionOptionsComponentProps<QType extends QuestionUnion> {
    register:UseFormRegister<QType>
    watch:UseFormWatch<QType>
    control:Control<QType>
    errors:FieldErrors<QType>
}

/**
 *   @param action Acțiunea realizată de editorul de element asupra elementului, folosind index-ul și datele despre element.
 *   @param questionIsNew Funcție ce precizează dacă întrebarea este nou adăugată.
 */
interface QuestionEditorProps {
    setQuestionToBeEdited:(questionIndex:number, set:boolean)=>void
    setQuestionNew:(questionIndex:number, set:boolean)=>void
    questionIsNew:(questionIndex:number)=>boolean
    deleteQuestion:(questionIndex:number)=>void
    action:(questionIndex:number, question:QuestionUnion)=>void;
    questionIndex:number
    questionData?:QuestionUnion
}

interface GridChoiceComponentProps {
    choice:GridChoice
    index:number
    register:UseFormRegister<GridChoices>
    errors:FieldErrors<GridChoices>
    removeChoice:(optionIndex:number)=>void
}

// Componenta menita pentru afisarea optiunilor intrebarilor de tip text.
function TextQuestionOptions(props:QuestionOptionsComponentProps<TextQuestion>) {
    return (
        <div className={'text-question'}>
            
            <div className={'max-chars'}>
                <label>
                    Maximum characters:
                </label>
                <input data-tooltip-id={'specificOptions.maxChars'}
                       {...props.register("maxChars",
                           {max: {value:10000,
                                       message:"Answers should not have more than 10000 characters!"}
                           })} defaultValue={30}  type={'number'} />
                <FormInputErrorPopup name={"specificOptions.maxChars"} errors={props.errors} place={'top'} />
            </div>
        </div>
    )
}

// Componenta creata pentru a afisa caseta de introducere a unei variante de raspuns al intrebarii grila
function GridChoiceComponent ({register, removeChoice, index, errors}:GridChoiceComponentProps) {
    return (
        <li key={index} >
            <div >
                <input defaultValue={`Choice #${index}`} {...register(`choices.${index}.text`)}
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

const gridChoicesSchema = z.object({
    choices:z.array(zGridChoice)
}); type GridChoices = z.infer<typeof gridChoicesSchema>

// Componenta menita pentru afisarea optiunilor intrebarilor de tip grilă.
function MCQuestionOptions(props:QuestionOptionsComponentProps<MCQuestion>) {
    
    // Folosim un formular separat pentru variantele de raspuns.
    // O alternativa ar fii fost folosirea hook-ului useFieldArray, dar dat fiind faptul ca variantele sunt reprezentate
    // sub forma unui sir de string-uri, ar fii fost nevoie de folosirea unui obiect specific pentru variantele de raspuns,
    // respectiv al unui nou obiect pentru intrebarea propriu-zisa (care ar fii fost prea complex ca sa merite).
    const {getValues, register, setValue, formState:{errors}} = useForm<GridChoices>({resolver:zodResolver(gridChoicesSchema)})
    
    const currentChoices = getValues("choices")
    
    // Adaugă un loc nou de introducere a unei opțiuni
    function addChoice() {
        const newChoice:GridChoice = {text:`Choice ${currentChoices.length + 1}`}
        setValue("choices", [...currentChoices, newChoice])
    }
    
    // Sterge o opțiune
    function removeChoice(choiceIndex:number) {
        const newChoices = currentChoices.splice(choiceIndex, 1)
        setValue("choices", newChoices)
    }

    return (
        <div className={'grid-question'}>
            <div className={'options-frame'}>

                <div className={'option'}>
                    <input {...props.register("isMultipleChoice")} type='checkbox'/>
                    <p>Multiple choice</p>
                </div>
            </div>
            {
               currentChoices.length>0 &&
                <ol>
                    {
                        currentChoices.map((choice, index)=>{
                            return (
                                <GridChoiceComponent
                                     choice={choice}
                                     register={register}
                                     index={index}
                                     errors={errors}
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


function getDefaultQuestionOptions(questionData:QuestionUnion|undefined, questionIndex:number):QuestionUnion {
    
    if (questionData)
        return questionData
    else {
        return {
            text: `Question #${questionIndex + 1} text`,
            isOptional: false,
            maxChars: 30,
            questionType: QuestionType.TEXT,
            elemType: ElemType.QUESTION
        }
    }
}

// Componenta ce ofera posibilitatea de a creea o noua intrebare sau de a edita o intrebare existenta
export function QuestionEditor(props:QuestionEditorProps) {

    // aceasta componenta este si ea un formular a carui folosire creeaza o noua intrebare
    // de fapt, si editarea se realizeaza sub forma de creare a unei intrebari noi, prin inlocuirea optiunilor
    // optiunilor intrebarii cu noi opriuni
    const {register, formState:{errors}, control, watch, getValues, trigger} = useForm<QuestionUnion>(
        { values:getDefaultQuestionOptions(props.questionData, props.questionIndex),
            mode: "onChange"
        }
    );

    const type = watch('questionType');

    // handler pentru adaugarea unei noi intrebari
    const submit = async (data:QuestionUnion)=>{

        props.action(props.questionIndex, data);
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
                <select {...register("questionType")}>
                    <option value='text'>Text Question</option>
                    <option value='grid'>Grid Question</option>
                </select>
            </div>
            
            
            <div className={'option'}>
                <input {...register("isOptional")} type='checkbox'/>
                <p>Optional</p>
            </div>
            
            {
                <Switch<QuestionType> components={[
                    {
                        Component:<MCQuestionOptions register={register as UseFormRegister<MCQuestion>}
                                     watch={watch as UseFormWatch<MCQuestion>}
                                     errors={errors}
                                     control={control as Control<MCQuestion>} />,
                        condition: QuestionType.MC
                    },
                    {
                        Component:<TextQuestionOptions register={register as UseFormRegister<TextQuestion>}
                                     watch={watch as UseFormWatch<TextQuestion>}
                                     errors={errors}
                                     control={control as Control<TextQuestion>} />,
                        condition: QuestionType.TEXT
                    }
                ]}
                    switchValue={type}
                    conditionEvaluator={(a:QuestionType, b:QuestionType)=>{return a === b}}
                />
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