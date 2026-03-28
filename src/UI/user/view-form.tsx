import {type FormInfo, GridAnswer, GridQuestion, type Submission, TextAnswer, TextQuestion} from "../domain/types";
import {add_form, get_form, delete_form} from "./back-end-connection";
import React from "react";

import type {MouseEvent} from "react";

import {DisplayQuestion} from "../common/display-questions";
import {Outlet, useNavigate, useOutletContext, useParams} from "react-router-dom";

interface TextAnswersDisplayComponentProps {
    answers?: TextAnswer[]
}

function TextAnswersDisplayComponent({answers}:{answers: Array<TextAnswer>}) {

    const [displayAnswers, setDisplayAnswers] = React.useState(true);

    function buttonOnClick(evt: MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (displayAnswers) {
            const target: HTMLButtonElement = evt.target as HTMLButtonElement;
            target.textContent = 'Show answers'
            setDisplayAnswers(false);
        } else {
            const target: HTMLButtonElement = evt.target as HTMLButtonElement;
            target.textContent = 'Hide answers'
            setDisplayAnswers(true);
        }
    }

    return (
        <div style={{
            display:"grid",
            gridTemplateColumns:'auto 1fr',
            alignItems:'start',
            margin:'5px'
        }}>
            <button onClick={(evt: any) => {
                buttonOnClick(evt)
            }}>
                Hide answers
            </button>
            {
                displayAnswers &&
                <div>
                    <ol>
                        {
                            answers.map((answer: TextAnswer, index) => {
                                return (
                                    <li key={index} style={{marginBottom:'5px'}}>
                                        {answer.text}
                                    </li>
                                )
                            })
                        }
                    </ol>
                </div>
            }
        </div>
    )
}

function GridAnswersDisplayComponent({answers, choices}:{answers: Array<GridAnswer>, choices:Array<string>}) {

    function computeAverage(choiceIndex: number): number {
        let average: number = 0;
        if (answers)
            for (let answer of answers) {
                if (choiceIndex in answer.choices)
                    average += 1
            }
        return (average / answers.length * 100)
    }

    return (
        <div>
            <ol>
            {
                choices.map((choice, index) => {
                    return (
                        <li key={index} style={{marginBottom:'10px'}}>
                            <div style={{display:'flex', flexWrap:'wrap', gap:'10px', marginLeft:'10px'}}>
                                <p style={{margin:'0'}}>
                                    {`${choice}`}
                                </p>
                                <p  style={{margin:'0'}}>
                                    { `${computeAverage(index)}%`}
                                </p>
                            </div>
                        </li>
                    )

                })
            }
            </ol>
        </div>
    )
}

export function DisplaySubmissionData() {

    const navigate = useNavigate();

    const form: FormInfo = useOutletContext();

    let submissions;
    let questions:Array<TextQuestion|GridQuestion>;


    submissions = form.submissions;
    questions = form.questions;



    const [displayMode, setDisplayMode] = React.useState('statistic');

    function mapTextSubmissions(submissions: Array<Submission>, index: number): TextAnswer[] {
        const mappedSubmissions: TextAnswer[] = submissions.map((submission, submissionIndex): TextAnswer => {
            if (submission.answers[index] instanceof TextAnswer)
                return submission.answers[index];
            return new TextAnswer('');
        })
        return mappedSubmissions
    }

    function mapGridSubmissions(submissions: Array<Submission>, index: number): GridAnswer[] {
        const mappedSubmissions: GridAnswer[] = submissions.map((submission, submissionIndex): GridAnswer => {
            if (submission.answers[index] instanceof GridAnswer)
                return submission.answers[index];
            return new GridAnswer([]);
        })
        return mappedSubmissions
    }

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>

            <div className={'form-frame'}>

                <select onChange={(selectEvent) => {
                    setDisplayMode(selectEvent.target.value);
                }} style={{
                    alignSelf:'start'
                }}>
                    <option value={'statistic'}>Individual</option>
                    <option value={'individual'}>Statistic</option>
                </select>

                {

                    submissions ?
                        displayMode === 'individual' ?
                            submissions.map(
                                (submission, index) => {
                                    return (
                                        <div key={index}>
                                            <h3>
                                                {`Submission #${index}:`}
                                            </h3>
                                            <div>
                                                {
                                                    questions.map(
                                                        (question, questionIndex) => {
                                                            return (
                                                                <div>
                                                                    <h5>
                                                                        {`Question #${index}:`}
                                                                    </h5>
                                                                    <div>
                                                                        <p>Answer:</p>
                                                                        {
                                                                            (submission.answers[questionIndex] instanceof TextAnswer) &&
                                                                            <div>
                                                                                <p>
                                                                                    Text:
                                                                                </p>
                                                                                {submission.answers[questionIndex].text}
                                                                            </div>
                                                                        }
                                                                        {
                                                                            (submission.answers[questionIndex] instanceof GridAnswer
                                                                                && question instanceof GridQuestion) &&
                                                                            <div>
                                                                                <p>
                                                                                    Choices:
                                                                                </p>
                                                                                <ol>
                                                                                    {submission.answers[questionIndex].choices.map((choice: number) => {
                                                                                        return <li>{question.choices[choice]}</li>
                                                                                    })}
                                                                                </ol>

                                                                            </div>
                                                                        }
                                                                    </div>

                                                                </div>
                                                            )
                                                        }
                                                    )
                                                }
                                            </div>
                                        </div>
                                    )
                                }
                            )
                            :
                            <div>
                                <ol className={'form-question-list'}>
                                {
                                    form.questions.map((question, index) => {
                                        return (
                                            <li key={index} className={'form-question'}>
                                                <p style={{margin: '5px'}}>
                                                    {question.text}
                                                </p>
                                                {
                                                    question instanceof TextQuestion &&
                                                    <TextAnswersDisplayComponent answers={mapTextSubmissions(submissions, index)} />
                                                }
                                                {
                                                    question instanceof GridQuestion &&
                                                    <GridAnswersDisplayComponent answers={mapGridSubmissions(submissions, index)} choices={question.choices}/>
                                                }
                                            </li>
                                        )
                                    })
                                }
                                </ol>
                            </div>
                        :
                        <h2>
                            This form does not have any submissions yet!
                        </h2>
                }
            </div>
        </div>
    )

}

export function DisplayFrom() {

    const form: FormInfo = useOutletContext();
    const navigate = useNavigate();


    let formQuestions: Array<TextQuestion | GridQuestion> = new Array<TextQuestion | GridQuestion>()
    if (form) {
        formQuestions = form.questions.map(
            (question: any) => {
                if (Object.hasOwn(question, 'choices'))
                    return new GridQuestion(question.text, question.isOptional, question.isMultipleChoice, question.choices)
                return new TextQuestion(question.text, question.isOptional, question.maxChars);
            }
        );
        console.log(formQuestions);
    }

    async function deleteForm() {
        const deleteFormResponse: boolean = await delete_form(form.name);
        if (deleteFormResponse) {
            alert("Form deleted succesfully")
            navigate('/');
        } else alert("Could not delete form :(")
    }

    return (

        form &&
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
            <div className={'form-frame'}>

                <ol className={'form-question-list'}>

                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <h1 className={'form-title'}>
                            {form.name}
                        </h1>
                    </div>

                    {
                        formQuestions.length > 0 ?
                            formQuestions.map(
                                (question: TextQuestion | GridQuestion, index: number) => {
                                    return (
                                        <DisplayQuestion questionIndex={index + 1} question={question}/>
                                    )
                                }
                            ) :
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <h3>
                                    This form has no questions.
                                </h3>
                            </div>
                    }
                </ol>

                <div style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(3, 1fr)'
                }}>
                    <button onClick={() => {
                        navigate(-1);
                    }} style={{}}>
                        Back
                    </button>

                    <button onClick={() => {
                        navigate('submissions')
                    }}>
                        See results
                    </button>

                    <button onClick={deleteForm}>
                        Delete
                    </button>

                </div>


            </div>
        </div>


    )

}

export function ViewForm() {

    const [form, setForm] = React.useState<FormInfo>();
    const [loading, setLoading] = React.useState(true)
    const formName = useParams().formName as string;
    const navigate = useNavigate();

    React.useEffect(
        () => {
            async function f(): Promise<void> {
                const newForm: FormInfo | undefined = await get_form(formName);
                if (newForm) {
                    setForm(newForm);
                    setLoading(false);
                }
                console.log("Performed fetch")
            }

            f();
        }
        , []);

    // daca nu punem conditia de loading, crapa codu la refresh in /submissions ca nu apuca sa dea fetch
    return (
        loading?
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <h2>
                    Loading...
                </h2>
            </div>:
            <Outlet context={form}/>
    )
}