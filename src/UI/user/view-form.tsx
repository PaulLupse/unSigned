import {type FormInfo, GridQuestion, TextQuestion} from "../domain/types";
import {add_form, get_form} from "./back-end-connection";
import React from "react";

import {DisplayQuestion} from "../common/display-questions";
import {useOutletContext, useParams} from "react-router-dom";

export default function ViewForm()
{

    const [form, setForm] = React.useState<FormInfo>();
    const formName = useParams().formName as string;

    React.useEffect(
        ()=>{
            async function f():Promise<void>{
                const newForm:FormInfo|undefined=await get_form(formName);
                if(newForm)
                {
                    setForm(newForm);
                }
            }
            f();
        }
    ,[]);

    let formQuestions:Array<TextQuestion|GridQuestion> = new Array<TextQuestion | GridQuestion>()
    if(form) {
        formQuestions = form.questions.map(
            (question:any) => {
                if(Object.hasOwn(question, 'choices'))
                    return new GridQuestion(question.text, question.isOptional, question.isMultipleChoice, question.choices)
                return new TextQuestion(question.text, question.isOptional, question.maxChars);
            }
        );
        console.log(formQuestions);
    }

    return (

        form &&
        <div style={{display:'flex', justifyContent:'center', height:'100%'}}>
            <div className={'form-frame'}>

                <ol className={'form-question-list'}>

                    <div style={{display:'flex', justifyContent:'center'}}>
                        <h1 className={'form-title'}>
                            {form.name}
                        </h1>
                    </div>

                    {
                        formQuestions.length>0?
                        formQuestions.map(
                            (question:TextQuestion|GridQuestion, index:number)=> {
                                return(
                                    <DisplayQuestion questionIndex={index+1} question={question} />
                                )
                            }
                    ):
                    <div style={{display:'flex', justifyContent:'center'}}>
                        <h3>
                            This form has no questions.
                        </h3>
                    </div>
                }
                </ol>

            </div>
        </div>


    )
}