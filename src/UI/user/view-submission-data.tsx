import type {FormInfo, GridAnswer, GridQuestion, Submission, TextAnswer, TextQuestion} from "../domain/types";
import {formInfoSchema} from "../domain/schemas";
import {useNavigate, useOutletContext} from "react-router-dom";
import React from "react";

function StatisticTextAnswersDisplayComponent({answers}:{answers: Array<TextAnswer>}) {

    const [displayAnswers, setDisplayAnswers] = React.useState(true);

    function buttonOnClick(evt: MouseEvent) {
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
                                    answer.text &&
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

function StatisticGridAnswersDisplayComponent({answers, choices}:{answers: Array<GridAnswer>, choices:Array<string>}) {

    function computeAverage(choiceIndex: number): number {
        let average: number = 0;

        if (answers)
            for (let answer of answers) {
                if (answer.choices.includes(choiceIndex))
                    average += 1
            }

        return Number((average / answers.length * 100).toFixed(2))
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

function IndividualTextAnswerDisplayComponent({answer}:{answer:TextAnswer}) {
    return (
        <div style={{
            display:'grid',
            gridTemplateColumns:'auto 1fr',
            gap:"5px",
            margin:'5px'
        }}>
            <p  style={{margin:'0'}}>
                Text:
            </p>
            <div>
            {
                <p style={{margin:'0'}}>
                    {answer.text}
                </p>
            }
            </div>
        </div>
    )
}

function IndividualGridAnswerDisplayComponent({answer, question}:{answer:GridAnswer, question:GridQuestion}) {
    return (
        <div style={{
            display:'grid',
            gridTemplateColumns:'auto 1fr',
            margin:'5px'
        }}>
            <p style={{margin:'0'}}>
                Choices:
            </p>
            <div>
                <ol>
                    {answer.choices.map((choice: number) => {
                        return <li value={choice}>{question.choices[choice]}</li>
                    })}
                </ol>
            </div>
        </div>
    )
}

function IndividualDisplay({submissions, questions}:{submissions:Submission[], questions:Array<TextQuestion|GridQuestion>}) {
    return(
        submissions.map(
            (submission, index) => {
                return (
                    <div key={index} style={{
                        display:"flex",
                        flexDirection:'column',
                        justifyContent:'start',
                        border:'1px solid',
                        padding:'10px'
                    }}>
                        <h3 style={{margin:'0', marginLeft:'10px', padding:'10px'}}>
                            {`Submission #${index}:`}
                        </h3>
                        <div>
                            <ol style={{
                                padding:'10px',
                                margin:'0'
                            }}>
                            {
                                submission.answers.map(
                                    (answer:TextAnswer|GridAnswer, answerIndex) => {

                                        if(!questions[answerIndex]) {
                                            throw new Error("Too many answers!");
                                        }
                                        const question = questions[answerIndex];

                                        return (
                                            <li className={'form-question'} >
                                                <p style={{
                                                    margin:"5px"
                                                }}>
                                                    {questions[answerIndex]?.text}
                                                </p>

                                                {
                                                    answer.type=='text' &&
                                                        <IndividualTextAnswerDisplayComponent answer={answer}/>
                                                }
                                                {
                                                    answer.type=='grid'  &&  question.type == 'grid' &&
                                                        <IndividualGridAnswerDisplayComponent answer={answer} question={question}/>
                                                }

                                            </li>
                                        )
                                    }
                                )
                            }
                            </ol>
                        </div>
                    </div>
                )
            }
        )
    )
}

function StatisticDisplay({submissions, questions}:{submissions:Submission[], questions:Array<TextQuestion|GridQuestion>}) {

    function mapTextSubmissions(submissions: Array<Submission>, questionIndex: number): TextAnswer[] {
        return submissions.map((submission): TextAnswer => {
            if(submission.answers[questionIndex]?.type == 'text')
                return submission.answers[questionIndex];
            else throw new Error("Wrong answer type. Expected text.")
        })
    }

    function mapGridSubmissions(submissions: Array<Submission>, questionIndex: number): GridAnswer[] {
        return submissions.map((submission): GridAnswer => {
            if (submission.answers[questionIndex]?.type == 'grid')
                return submission.answers[questionIndex];
            else throw new Error("Wrong answer type. Expected grid.")
        })
    }

    return (
        <div>
            <ol className={'form-question-list'} style={{justifyContent:'start', padding:'20px'}}>
            {
                questions.map((question, index) => {
                    return (
                        <li key={index} className={'form-question'}>
                            <p style={{margin: '5px'}}>
                                {question.text}
                            </p>
                            {
                                question.type == 'text' &&
                                <StatisticTextAnswersDisplayComponent answers={mapTextSubmissions(submissions, index)} />
                            }
                            {
                                question.type == 'grid' &&
                                <StatisticGridAnswersDisplayComponent answers={mapGridSubmissions(submissions, index)} choices={question.choices}/>
                            }
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

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'start',
            overflowY:"scroll"
        }}>

            <div className={'form-frame'}>

                <h1 style={{
                    textAlign:'center'
                }}>
                    Submissions for {form.name}
                </h1>

                <div style={{
                    display:"flex",
                    justifyContent:'space-between'
                }}>

                    <button onClick={()=>{navigate(-1);}}>
                        Back
                    </button>

                    <div style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        gap:'5px'
                    }}>
                        <p style={{margin:'0'}}>
                            Display:
                        </p>
                        <div>
                            <select onChange={(selectEvent) => {
                                setDisplayMode(selectEvent.target.value);
                            }} style={{
                                alignSelf:'start'
                            }}>
                                <option value={'statistic'}>Statistic</option>
                                <option value={'individual'}>Individual</option>
                            </select>
                        </div>

                    </div>

                </div>


                {
                    submissions && submissions.length ?
                        displayMode === 'individual' ?
                            <IndividualDisplay submissions={submissions} questions={questions} />
                            :
                            <StatisticDisplay  submissions={submissions} questions={questions} />
                        :
                        <h2 style={{textAlign:'center'}}>
                            This form does not have any submissions yet!
                        </h2>
                }
            </div>

        </div>
    )

}