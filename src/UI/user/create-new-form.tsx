import React, {type SetStateAction, useState} from "react";
import {createRoot} from "react-dom/client";
import type {RefObject, Dispatch} from "react";
import {logout, auto_login, add_form} from "./back-end-connection";

import configFile from "../config.json"
import {useNavigate, BrowserRouter} from "react-router-dom";

import {FormInfo, type Submission} from "../domain/types";
import {TextQuestion, GridQuestion} from "../domain/types";

import {DisplayQuestion} from "./display-questions";

const baseURL:string = configFile.baseURL

interface GridQuestionOptionsProps {
    setChoices: Dispatch<SetStateAction<any>>;
    choices: Array<string>;
}

function NewGridQuestionOptions(props:GridQuestionOptionsProps) {

    const inputNewOptionText = React.useRef<HTMLInputElement>(null);

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);


    return (
        <>
            {
                props.choices.length>0 &&
                <div id="OptiuniIntrebare" style={{maxHeight:'100px', overflowX:'auto', gap:'5px', display:'flex', flexDirection:'column'}}>
                    {
                        props.choices.map(
                            (text:string, index:number)=>{
                                return (
                                    <div style={{display:'flex', gap:'5px'}}>
                                        <p key={index} style={{flexGrow:'1', margin:'0'}}>{index+1}. {text}</p>
                                        <button onClick={
                                                () => {
                                                    const newChoices:Array<string> = props.choices;
                                                    newChoices.splice(index, 1);
                                                    props.setChoices(newChoices);

                                                    forceUpdate();
                                                }
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )
                            }
                        )
                    }
                </div>
            }



            <input type={'text'} ref={inputNewOptionText} placeholder={'Option text'} />

            <div style={{display:'flex', justifyContent:'center'}}>
                <button  onClick={
                    ()=>{
                        // metoda pentru adaugarea unei noi variante de raspuns
                        if(inputNewOptionText.current) {
                            const newOptionValue:string = inputNewOptionText.current.value;
                            if(newOptionValue==='')
                                alert("Choice cannot be empty.")
                            else {
                                props.setChoices([...props.choices, inputNewOptionText.current.value])
                                inputNewOptionText.current.value = '';
                            }

                        }
                    }
                }
                style={{maxWidth:'200px', flexGrow:'1'}}>
                    Add option
                </button>
            </div>

        </>
    )
}


interface CreateNewQuestionProps {
    setDisplayQuestionCreator:Dispatch<SetStateAction<any>>;
    addQuestionCallback:(question:GridQuestion|TextQuestion)=>void;
}

function CreateNewQuestion(props:CreateNewQuestionProps) {

    const [questionType, setQuestionType] = React.useState('grid');
    const inputQuestionText = React.useRef<HTMLInputElement>(null);
    const isOptionalCheckbox = React.useRef<HTMLInputElement>(null);
    const isMultipleChoiceCheckbox = React.useRef<HTMLInputElement>(null);

    // specific intrebarilor de tip grila
    const [options, setOptions] = React.useState(Array<string>);

    return (
        <div id="CreateNewQuestionDiv" style={{display:'flex', flexGrow:'1', maxWidth:'400px', flexDirection:'column', alignItems:'stretch', gap:'5px', padding:'10px'}}>

            <input ref={inputQuestionText} type='text' placeholder="Question text" style={{border:'0px',
                    borderBottom:'dashed 1px', maxWidth:'400px'}} maxLength={60}/>

            <div style={{display:'flex', justifyContent:'space-between'}}>
                <input ref={isOptionalCheckbox} type='checkbox' />
                <p style={{margin:'0'}}>Optional</p>
                {
                    (questionType=='grid') &&
                    <>
                        <input ref={isMultipleChoiceCheckbox} type='checkbox' />
                        <p style={{margin:'0'}}>Multiple Choice</p>
                    </>
                }

            </div>

            <select onChange ={
                (event) => {
                    setQuestionType(event.target.value);
                }
            }>
                <option value='grid'>Grid Question</option>
                <option value='text'>Text Question</option>
            </select>

            {
                questionType==='grid' &&
                <NewGridQuestionOptions setChoices={setOptions} choices={options}/>
            }
            <div style={{display:'flex', justifyContent:'center'}}>
                <button style={{flexGrow:'1', maxWidth:'200px'}}
                    onClick={
                    ()=>{
                        if(inputQuestionText.current && isOptionalCheckbox.current) {
                            const questionText:string = inputQuestionText.current.value;
                            const isOptional:boolean = isOptionalCheckbox.current.checked;
                            if(questionType==='grid' && isMultipleChoiceCheckbox.current) {
                                const isMultipleChoice:boolean = isMultipleChoiceCheckbox.current.checked;
                                props.addQuestionCallback(new GridQuestion(questionText, isOptional, isMultipleChoice, options));
                            }
                            else if(questionType==='text')
                                props.addQuestionCallback(new TextQuestion(questionText, isOptional, 30));
                        }

                        props.setDisplayQuestionCreator(false);
                    }
                }>
                    Add
                </button>
            </div>
        </div>
    )
}

export default function CreateNewForm() {

    const nameInput:RefObject<HTMLInputElement|null> = React.useRef(null);
    const keyInput:RefObject<HTMLInputElement|null> = React.useRef(null);

    const [formQuestions, setFormQuestions] = useState(Array<TextQuestion|GridQuestion>);

    const [displayQuestionCreator, setDisplayQuestionCreator] = React.useState(false);


    return (
        <div id="Continut" style={{display:'flex', alignItems:'start', height:'100%', justifyContent:'center'}}>
            <div style={{display:'flex', flexDirection:'column', justifyContent:"start", alignContent:"center",
                    maxWidth:'600px', flexGrow:'1', gap:'5px', padding:'10px', overflow:'auto'}}>

                <div style={{display:'flex', justifyContent:'center'}}>
                    <input type='text' maxLength={30} ref={nameInput} placeholder="Form name" style={{border:'0px',
                        borderBottom:'dashed 1px', maxWidth:'200px', textAlign:'center', flexGrow:'1'}}/>
                </div>
                <div style={{display:'flex', justifyContent:'center'}}>
                    <input type='text' maxLength={30} ref={keyInput} placeholder="Key" style={{border:'0px',
                        borderBottom:'dashed 1px', maxWidth:'200px', textAlign:'center', flexGrow:'1'}}/>
                </div>

                {
                    formQuestions.map(
                        (question:TextQuestion|GridQuestion, index:number)=> {
                            return(
                                <DisplayQuestion questionIndex={index+1} question={question} />
                            )
                        }
                    )
                }
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
                    <button onClick={
                        async() => {

                            const newForm:FormInfo = {
                                name:nameInput.current?nameInput.current.value:'',
                                questions:formQuestions,
                                key:keyInput.current?keyInput.current.value:'',
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
                    } style={{maxWidth:'200px', flexGrow:'1'}}
                    >
                        Create
                    </button>
                </div>

            </div>

            {
                displayQuestionCreator &&
                <CreateNewQuestion setDisplayQuestionCreator={setDisplayQuestionCreator}
                    addQuestionCallback={
                        (question:TextQuestion|GridQuestion) => {
                            setFormQuestions([...formQuestions, question]);
                        }
                }/>
            }

        </div>

    )
}
