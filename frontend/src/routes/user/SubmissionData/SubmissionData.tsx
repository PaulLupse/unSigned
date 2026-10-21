
import {useNavigate, useOutletContext} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getFormSubmissionData} from "src/backend-connection/users";
import {FixedElement} from "src/components/FixedElement/FixedElement";
import {NavButton} from "src/components/Buttons/Buttons";
import * as style from './SubmissionData.module.css'
import * as questionDisplayerStyle from 'src/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'

import 'src/components/Form/CommonFormStyle.css'
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import Loading from "src/components/Loading";
import {
    type AnswerUnion, ElemType,
    type Form, type MCAnswer,
    type MCQuestion,
    type MCQuestionStatistic,
    type QuestionStatisticUnion,
    QuestionType,
    type QuestionUnion,
    type Submission,
    type TextAnswer,
    type TextQuestion,
    type TextQuestionStatistic
} from "src/client/types.gen";

function TextAnswerDisplayComponent({answer}:{answer:TextAnswer}) {
    return (
        <p style={{margin:'0', border:'1px solid'}}>
            {answer.text?answer.text:"Not answered"}
        </p>
    )
}

function MCAnswerDisplayComponent({answer, question}:{answer:MCAnswer, question:MCQuestion}) {
    return (
        <span className={style.gridChoicesInline}>

            {
                answer.choices.length == 0?<p>Not answered</p>:
                answer.choices.map((choice: number) => {
                    return (
                        <div className={style.choice}>
                            <label>{choice}.</label>
                            <p>{question.choices[choice]?.label}</p>
                        </div>
                    )
                })
            }
        </span>
    )
}

function AnswerList({submission, questions}:{submission:Submission, questions:Array<QuestionUnion>}) {

    return (
        submission.answers.map(
            (answer:AnswerUnion, answerIndex) => {

                if(!questions[answerIndex]) {
                    throw new Error("Too many answers!");
                }
                const question = questions[answerIndex];

                if (question.questionType !== answer.type)
                    throw new Error("Question and answer types not matching.")

                return (
                    <li className={style.answer}>
                        <p>
                            {questions[answerIndex]?.text}
                        </p>
                        {
                            answer.type==QuestionType.TEXT &&
                                <TextAnswerDisplayComponent answer={answer}/>
                        }
                        {
                            answer.type===QuestionType.MC  && question.questionType===QuestionType.MC &&
                                <MCAnswerDisplayComponent answer={answer} question={question}/>
                        }

                    </li>
                )
            }
        )
    )
}

function SubmissionDisplay({submission, index, questions}:{submission:Submission, index:number, questions:Array<TextQuestion|MCQuestion>}) {

    const [display, setDisplay] = useState<boolean>(false)

    return (
        <div key={index} className={style.submission}>
            <div>
                <h3 style={{textAlign:'left'}}>
                    {`Submission #${index}:`}
                </h3>
                <button onClick={()=>{setDisplay(!display)}}>
                    {
                        display?'Hide':'Display'
                    }
                </button>
            </div>
            {
                display &&
                <ol>
                    <AnswerList submission={submission} questions={questions}/>
                </ol>
            }
        </div>
    )
}

function IndividualDisplay({submissions, questions}:{submissions:Submission[], questions:Array<TextQuestion|MCQuestion>}) {
    return(
        submissions.map(
            (submission, index) => {
                return (
                    <SubmissionDisplay key={index} submission={submission} index={index} questions={questions} />
                )
            }
        )
    )
}

function TextAnswerStatisticDisplay({answerStatistic, question}:{answerStatistic:TextQuestionStatistic, question:QuestionUnion}) {
    return (
        <div className={style.textStatDisp}>
            <div className={style.element}>
                <p>Average word count: {answerStatistic.avgWordCount}</p>
            </div>
            <hr style={{width:'100%',border:'1px solid gray', boxSizing:'border-box'}} />
            <div className={style.element}>
                <p>Most common words: </p>
                <ol>
                    {
                        answerStatistic.frequentWords.map((word:string, index)=>{
                            return (
                                <li><p>{word}</p></li>
                            )
                        })
                    }
                </ol>

            </div>
        </div>
    )
}

function MCAnswerStatisticDisplay({answerStatistic, question}:{answerStatistic:MCQuestionStatistic, question:MCQuestion}) {
    return (
        <div className={style.choicePercentageGroup}>
            <p>Choice percentages:</p>
            <ol>
                {
                    question.choices.map((choice:string, index:number)=>{
                        return (
                            <li>
                                <div className={style.choicePercentage}>
                                    <p>{choice}:</p>
                                    <p>{answerStatistic.answerRate[index]?.toFixed(2)} %</p>
                                </div>
                            </li>
                        )
                    })
                }
            </ol>
        </div>
    )
}

function AnswerStatisticDisplay({answerStatistic, question, index}:{answerStatistic:QuestionStatisticUnion, question:QuestionUnion, index:number}) {

    return (
        <li className={questionDisplayerStyle.question}>
            <div className={style.header}>
                <p>
                    {question.text}
                </p>
                {
                    question.isOptional?
                        <p>{answerStatistic.engagement}% of users answered</p>
                        :
                        <p>Required</p>
                }
            </div>
            <hr color={'gray'}/>
            {
                answerStatistic.type == 'text' && question.questionType == 'text' &&
                    <TextAnswerStatisticDisplay answerStatistic={answerStatistic} question={question} />
            }
            {
                answerStatistic.type == QuestionType.MC  && question.questionType == QuestionType.MC &&
                    <MCAnswerStatisticDisplay answerStatistic={answerStatistic} question={question} />
            }
        </li>
    )
}

function StatisticDisplay({statisticData, questions}:
                          {statisticData:Array<QuestionStatisticUnion>,
                              questions:Array<QuestionUnion>}) {

    return (
        <ol style={{padding:'10px'}}>
            {
                statisticData.map((ansStat, index)=>{
                    return(
                        <AnswerStatisticDisplay answerStatistic={ansStat}
                                                question={questions[index] as QuestionUnion}
                                                index={index}/>
                    )
                })
            }
        </ol>
    )
}

export function SubmissionData() {

    const navigate = useNavigate();

    const form: Form = useOutletContext();

    let submissions;
    let questions:Array<QuestionUnion>;

    submissions = form.submissions;
    questions = form.elements.filter(element=>element.elemType===ElemType.QUESTION);

    const statisticData = useQuery({
        queryFn:async()=>getFormSubmissionData(form.id),
        queryKey:['submissionData'],
        retry:0,
        refetchOnWindowFocus:false
    })

    useEffect(()=>{if(statisticData.isError)navigate(`/form/${form.id}/view`)})

    const [displayMode, setDisplayMode] = React.useState('individual');

    return (
        statisticData.isLoading?<Loading />:
        <div className={style.main}>
            <div className={'form'}>

                <h2>
                    Submissions for {form.title}
                </h2>

                {
                    submissions && submissions.length ?
                        <>
                            <p style={{marginBottom:'5px'}}>
                                Total submissions: {submissions.length}
                            </p>
                            {
                                displayMode === 'individual' ?
                                    <IndividualDisplay submissions={submissions} questions={questions} />
                                    :
                                    <StatisticDisplay statisticData={statisticData.data?statisticData.data:[]} questions={questions} />
                            }
                        </>
                        :
                        <h2 style={{textAlign:'center'}}>
                            This form does not have any submissions yet!
                        </h2>

                }

                <FixedElement>
                    <ButtonBar>
                        <NavButton to={`/form/${form.id}/view`}>Back</NavButton>
                        <div style={{display:'grid', gridTemplateColumns:'auto 1fr'}}>
                            <label>Display:</label>
                            <select onChange={(evt)=>setDisplayMode(evt.target.value)}>
                                <option value={'individual'}>Individual</option>
                                <option value={'statistic'}>Statistic</option>
                            </select>
                        </div>
                    </ButtonBar>
                </FixedElement>
            </div>
        </div>
    )

}