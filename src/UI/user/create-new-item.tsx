import React, {type SetStateAction, useState} from "react";
import {createRoot} from "react-dom/client";
import type {RefObject, Dispatch} from "react";
import {logout, auto_login, add_item} from "./back-end-connection";

import configFile from "../config.json"
import {useNavigate, BrowserRouter} from "react-router-dom";

import type {Item} from "./back-end-connection";

const baseURL:string = configFile.baseURL


class FormQuestion {
    text:string=''
    isOptional:boolean=false
    constructor(text:string, isOptional:boolean) {
        this.text = text;
        this.isOptional = isOptional;
    }
}

class GridQuestion extends FormQuestion {
    isMultipleChoice:boolean=false
    choices:Array<string>=new Array<string>
    constructor(text:string, isOptional:boolean, isMultipleChoice:boolean, choices:Array<string>) {
        super(text, isOptional);
        this.isMultipleChoice = isMultipleChoice;
        this.choices = choices;
    }
}

class TextQuestion extends FormQuestion {
    maxCharacters:number=30

    constructor(text:string, isOptional:boolean, maxChars:number) {
        super(text, isOptional);
        this.maxCharacters = maxChars
    }

}

interface TextQuestionProps {
    text:string
    isOptional:boolean
    maxCharacters:number
}

function TextQuestionComponent(props:TextQuestionProps) {
    return (
        <input type='text' maxLength={props.maxCharacters}/>
    )
}

interface GridQuestionProps {
    text:string
    isOptional:boolean
    isMultipleChoice:boolean
    choices:Array<string>
}

function GridQuestionComponent(props:GridQuestionProps) {
    return (
        <>
        {
            props.choices.map(
                (choice:string, index:number)=> {
                    return (
                        <div key={index} style={{display:'flex', alignItems:'center'}}>
                            <input type={props.isMultipleChoice?'checkbox':'radio'} />
                            <p style={{margin:'0'}}> {index+1}. {choice}</p>
                        </div>
                    )
                }
            )
        }
        </>
    )
}

interface DisplayQuestionProps {
    question:TextQuestion|GridQuestion
    questionIndex:number
}

function DisplayQuestion(props:DisplayQuestionProps) {

    const index:number = props.questionIndex
    const question = props.question
    return(
        <div key={index}>
            <p style={{margin:'5px'}}>
                {index}. {question.text}
            </p>
            {
               (question instanceof TextQuestion)?
                   <TextQuestionComponent text={question.text}
                                          isOptional={question.isOptional}
                                          maxCharacters={question.maxCharacters} />
                   :
                   <GridQuestionComponent text={question.text}
                                          isOptional={question.isOptional}
                                          isMultipleChoice={question.isMultipleChoice}
                                          choices={question.choices} />
            }
        </div>
    )
}

interface GridQuestionOptionsProps {
    setChoices: Dispatch<SetStateAction<any>>;
    choices: Array<string>;
}

function NewGridQuestionOptions(props:GridQuestionOptionsProps) {

    const inputNewOptionText = React.useRef<HTMLInputElement>(null);

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
                                        <button>
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
            }>
                Add option
            </button>
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
        <div id="CreateNewQuestionDiv" style={{display:'flex', flexGrow:'1', maxWidth:'400px', flexDirection:'column', alignItems:'stretch', gap:'5px'}}>

            <input ref={inputQuestionText} type='text' placeholder="Question text" style={{border:'0px',
                    borderBottom:'dashed 1px', maxWidth:'400px'}} maxLength={60}/>

            <div style={{display:'flex'}}>
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

            <button onClick={
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
    )
}

function CreateNewForm({username}:any) {

    const nameInput:RefObject<HTMLInputElement|null> = React.useRef(null);

    const [formQuestions, setFormQuestions] = useState(Array<TextQuestion|GridQuestion>);

    const [displayQuestionCreator, setDisplayQuestionCreator] = React.useState(false);


    return (
        <>
            <div style={{display:'flex', flexDirection:'column', justifyContent:"start", alignContent:"center",
                    maxWidth:'600px', flexGrow:'1', gap:'5px', padding:'10px', overflow:'auto'}}>

                <div style={{display:'flex', justifyContent:'center'}}>
                    <input type='text' maxLength={30} ref={nameInput} placeholder="Form name" style={{border:'0px',
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

                    <button onClick={
                        async() => {

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

        </>

    )
}

function Main() {

    const [username, setUsername] = React.useState('');
    // isLoggedIn = {-1, daca nu se stie starea de logare; 0, daca nu este logat userul; 1, daca este logat userul}
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);


    const navigate = useNavigate();

    // folosim un effect pentru a returna utilizatorul curent
    React.useEffect(()=> {
            async function getUser ():Promise<void> {
                const username:string|undefined = await auto_login();
                if(username) {
                    setUsername(username);
                    setIsLoggedIn(true);
                }
                else {
                    navigate(baseURL);
                }
            }
            getUser();
        },
        []
    );

    return (
        <div id="Pagina intreaga"
            style={{display:"flex", flexDirection:"column", height:'100vh', minWidth:'300px', alignItems:'stretch',
            gap:'10px', border:'solid 2px'}}>

            <div id="Bara de sus"
                style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
                borderBottom:'5px', borderBottomStyle:'double'}}>

                <div style={{display:"flex", alignItems:'center', gap:'10px', marginLeft:'10px'}}>
                    <p style={{textAlign:'center'}}>
                        Current user: {isLoggedIn?username:'none'}
                    </p>
                    {
                        isLoggedIn &&
                        <button
                            onClick={
                                async()=> {
                                    console.log("Logout button clicked")
                                    if (await logout()) {
                                        setUsername('');
                                        setIsLoggedIn(false);
                                        navigate(baseURL);
                                    }
                                }
                            }
                        >
                            Log out
                        </button>
                    }
                </div>

                <div style={{flexGrow:'1'}}>
                    <h1 style={{textAlign:'center'}}>
                        Create new form
                    </h1>
                </div>

            </div>

            <div id="Continut" style={{display:'flex', alignItems:'start', height:'100%', justifyContent:'center'}}>

                <CreateNewForm username={username}/>

            </div>


        </div>
    );
}

window.onload = () => {
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv);
    root.render(<BrowserRouter><Main /></BrowserRouter>);
}