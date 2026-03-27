import React, {type SetStateAction, use, useState} from "react";
import {createRoot} from "react-dom/client";
import type {RefObject, Dispatch} from "react";
import {
    useForm,
    type SubmitHandler,
    type UseFormRegister,
    type FieldValues,
    type UseFormWatch,
    type FormState,
    useFieldArray,
    type Control
} from "react-hook-form";
import {logout, auto_login, add_form} from "./back-end-connection";
import configFile from "../config.json"
import {FormInfo, type Submission} from "../domain/types";
import {TextQuestion, GridQuestion} from "../domain/types";
import {DisplayQuestion} from "../common/display-questions";

const baseURL:string = configFile.baseURL

interface GridQuestionOptionsProps {
    setChoices: Dispatch<SetStateAction<any>>;
    choices: Array<string>;
}

interface QuestionOptionsComponentProps {
    register:UseFormRegister<QuestionOptions>
    watch:UseFormWatch<QuestionOptions>
    formState:FormState<QuestionOptions>
    control:Control<QuestionOptions>
}

interface NewQuestionPanelProps {
    setDisplayQuestionCreator:Dispatch<SetStateAction<any>>;
    addQuestionCallback:(question:GridQuestion|TextQuestion)=>void;
}

interface GridChoice {
    text:string
}

interface QuestionOptions {
    text:string
    isOptional:boolean
    isMultipleChoice:boolean
    choices:GridChoice[]
}


function TextQuestionOptions(props:QuestionOptionsComponentProps) {
    return (
        <div style={{
            display:'flex',
            justifyContent:'center'
        }}>
            <input {...props.register("isOptional")} type='checkbox'/>
            <p>Optional</p>
        </div>
    )
}

function GridQuestionOptions(props:QuestionOptionsComponentProps) {

    // folosim un camp de tip array pentru a inregistra optiunile intrebarii grila
    const {fields, append, remove} = useFieldArray<QuestionOptions>({control:props.control, name:"choices"})

    function addOption() {
        append({text:''});
    }

    function removeOption(optionIndex:number) {
        remove(optionIndex);
    }

    return (
        <div style={{
            display:'flex',
            gap:'10px',
            flexDirection:'column'
        }}>
            <div style={{
                display:'flex',
                justifyContent:'space-evenly'
            }}>
                <div style={{
                    display:'flex'
                }}>
                    <input {...props.register("isOptional")} type='checkbox'/>
                    <p style={{margin:'0'}}>Optional</p>
                </div>

                <div style={{
                    display:'flex'
                }}>
                    <input {...props.register("isMultipleChoice")} type='checkbox'/>
                    <p style={{margin:'0'}}>Multiple choice</p>
                </div>
            </div>


            {
                fields.length>0 &&
                <ol style={{margin:'0'}}>
                    {
                        fields.map((option, index)=>{
                            return (
                                <li key={option.id}>
                                    <div style={{
                                        display:'grid',
                                        gridTemplateColumns:'1fr auto',
                                        gap:'5px'
                                    }}>
                                        <input {...props.register(`choices.${index}.text`)} />
                                        <button type="button" onClick={()=>{removeOption(index)}}>
                                            -
                                        </button>
                                    </div>
                                </li>
                            )
                        })
                    }
                </ol>
            }

            <div style={{display:'grid', alignItems:"center", justifyItems:'center'}}>
                <button type="button" onClick={addOption} style={{
                    width:'8rem'
                }}>
                    Add option +
                </button>
            </div>


        </div>

    )
}

function NewQuestionPanel(props:NewQuestionPanelProps) {

    const [questionType, setQuestionType] = React.useState('grid');

    const {register, formState, handleSubmit, control, watch} = useForm<QuestionOptions>();


    // handler pentru adaugarea unei noi intrebari
    const submit:SubmitHandler<QuestionOptions> = async (data:QuestionOptions)=>{

        if(questionType==='grid') {
            props.addQuestionCallback(new GridQuestion(data.text, data.isOptional, data.isMultipleChoice, data.choices.map(choice=>choice.text)));
        }
        else if(questionType==='text')
            props.addQuestionCallback(new TextQuestion(data.text, data.isOptional, 30));

        // panoul de creat intrebare noua dispare atunci cand este adaugata o noua intrebare
        props.setDisplayQuestionCreator(false);
    };

    return (
        <div id="CreateNewQuestionDiv"
             style={
            {
                flexGrow:'1',
                maxWidth:'400px',
                padding:'10px',
                border:'1px solid'
            }}>

            <form onSubmit={handleSubmit(submit)}>

                <div style={{
                    display:"flex",
                    flexDirection:'column',
                    gap:'10px',
                }}>

                    <div style={{
                        display:"flex",
                        flexDirection:'column',
                        alignItems:'center',
                        gap:'10px'
                    }}>
                        <textarea id="question" {...register("text")} placeholder="Question text"
                               style={{border:'1px solid',
                                        maxWidth:'400px',
                                        height:'4rem',
                                        alignSelf:'stretch',
                                        padding:'5px',
                                        overflow:'scroll',
                                        resize:'none'}} />

                        <select onChange ={
                            (event) => {
                                setQuestionType(event.target.value);
                            }
                        }>
                            <option value='grid'>Grid Question</option>
                            <option value='text'>Text Question</option>
                        </select>
                    </div>


                    {
                        questionType==='grid' &&
                        <GridQuestionOptions register={register} watch={watch} formState={formState} control={control} />
                    }
                    {
                        questionType==='text' &&
                        <TextQuestionOptions register={register} watch={watch} formState={formState} control={control} />
                    }

                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <button type={"button"} onClick={()=>{props.setDisplayQuestionCreator(false);}} className="button" style={{width:'8rem'}}>Cancel</button>
                        <input type="submit" value="Add question" className="plain-button" style={{width:'8rem'}}/>
                    </div>

                </div>
            </form>
        </div>
    )
}

export default function FormCreator() {

    const nameInput:RefObject<HTMLInputElement|null> = React.useRef(null);
    const keyInput:RefObject<HTMLInputElement|null> = React.useRef(null);

    const [formQuestions, setFormQuestions] = useState(Array<TextQuestion|GridQuestion>);
    const [displayQuestionCreator, setDisplayQuestionCreator] = React.useState(false);

    const createNewForm = async() => {
        const newForm:FormInfo = {
                                name:nameInput.current?nameInput.current.value:'',
                                questions:formQuestions,
                                dateCreated:null,
                                dateUpdated:null,
                                submissions:null
                            }

            console.log(formQuestions)

            const addResponse:boolean = await add_form(newForm);

            if(addResponse) {
                alert("Form created successfuly.")
            }
            else alert("Could not create form.")

    }


    return (
        <div id="Continut" style={{
            display:'flex',
            alignItems:'center',
            height:'100%',
            justifyContent:'center'
        }}>

            <div className={'form-frame'}>

                <ol className={'form-question-list'}>

                    <div style={{
                        display:'flex',
                        justifyContent:'center'
                    }}>

                        <input type='text' maxLength={30} ref={nameInput} placeholder="Form name" style={{
                            border:'0px',
                            borderBottom:'dashed 1px',
                            maxWidth:'200px',
                            textAlign:'center',
                            flexGrow:'1'
                        }}/>

                    </div>

                {
                    formQuestions.map(
                        (question:TextQuestion|GridQuestion, index:number)=> {
                            return(
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns:'1fr auto'
                                }}>
                                    <DisplayQuestion questionIndex={index+1} question={question} />
                                    <button style={{
                                        margin:'5px',
                                        aspectRatio:'1/1'
                                    }}>
                                        -
                                    </button>
                                </div>

                            )
                        }
                    )
                }
                </ol>

                <div style={{display:'flex', justifyContent:'center'}}>

                    <button onClick={
                            async() => {
                                setDisplayQuestionCreator(true)
                            }
                    }   style={{maxWidth:'200px', flexGrow:'1'}}
                    >Add new question</button>
                </div>

                <div style={{display:'flex', justifyContent:'center'}}>
                    {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                    <button onClick={createNewForm}
                     style={{maxWidth:'200px', flexGrow:'1'}}
                    >
                        Create
                    </button>
                </div>

            </div>

            {
                displayQuestionCreator &&
                <NewQuestionPanel setDisplayQuestionCreator={setDisplayQuestionCreator}
                    addQuestionCallback={
                        (question:TextQuestion|GridQuestion) => {
                            setFormQuestions([...formQuestions, question]);
                        }
                }/>
            }
        </div>

    )
}
