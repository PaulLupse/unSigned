import React, {useEffect} from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {add_form, create_template} from "../../../server/users-server";
import type {NewForm} from "../../../domain/types";
import type {TextQuestion, GridQuestion} from "../../../domain/types";
import {useLocation, useNavigate} from "react-router-dom";

import {newFormSchema} from "../../../domain/schemas";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "../../../components/Form/FormEditor/FormEditor";

import 'src/frontend/components/Form/CommonFormStyle.css'
import 'src/frontend/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/frontend/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './TemplateCreator.module.css'
import {FixedElement} from "src/frontend/components/FixedElement/FixedElement"
import Loading from "src/frontend/components/Loading";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function TemplateCreator() {

    const navigate = useNavigate();
    const loc = useLocation();

    const pathSegments = loc.pathname.split('/')
    const type:string|undefined = pathSegments[pathSegments.length - 1]

    const [loadingProgress, setLoadingProgress] = React.useState(false)

    const {register, formState:{errors}, handleSubmit, control, watch, getValues, setValue} = useForm<NewForm>({defaultValues:{questions:[], name:'New template'}});
    const {append, update, remove, swap} = useFieldArray({control, name:'questions'});
    const formQuestions = watch("questions");

    const {mutate, isPending} = useMutation({
        mutationFn:create_template,
        onSuccess:(formId:string|undefined)=>{
            toast.success("Template created successfully!");
            navigate(`/templates/${formId}/view`)
        },
        onError:(error)=>{
            toast.error("Could not create form. " + error?.message);
        }
    })


    useEffect(() => {

        const saveProgress = () => {
            const progress:NewForm = getValues();
            sessionStorage.setItem("savedProgress", JSON.stringify(progress))
        }

        window.addEventListener("beforeunload", saveProgress)

        return ()=>{
            window.removeEventListener("beforeunload", saveProgress);
            sessionStorage.clear()
        };

    }, []);

    // efect ce incarca progresul salvat in session storage
    useEffect(()=>{

        const progress:string|null = sessionStorage.getItem("savedProgress")
        if(progress) {
            const parseResult = newFormSchema.safeParse(JSON.parse(progress))
            if (parseResult.success) {
                setValue("questions", parseResult.data.questions);
                setValue("name", parseResult.data.name);
            }
        }
        setLoadingProgress(false);
    }, [])


    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {text:`Question #${formQuestions.length+1}`, type:"text", maxChars:30, isOptional:false}
        append(newQuestion);
        return formQuestions.length;
    }

    const swapQuestions = (q1Index:number, q2Index:number)=>{
        if (q1Index >= 0  &&  q2Index >= 0 && q1Index < formQuestions.length && q2Index < formQuestions.length)
            swap(q1Index, q2Index)
    }

    const saveQuestionChanges = (questionIndex:number, questionOptions:TextQuestion|GridQuestion) => {
        update(questionIndex, questionOptions);
    }

    const deleteQuestion = (questionIndex:number) => {
        remove(questionIndex)
    }

    const createNewForm:SubmitHandler<NewForm> = async(data:NewForm) => {

        console.log(data);
        const newForm:NewForm = newFormSchema.parse({
                                name:data.name,
                                questions:data.questions,
                            })
        mutate({templateData:newForm, type:type==='official'?'official':undefined});
    }

    return (
        <div className={style.main}>
            {
                loadingProgress ? <Loading/> :
                <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)}
                                     style={{width: '100%'}}>
                <FormEditor register={register}
                            errors={errors}
                            formQuestions={formQuestions}
                            addNewQuestion={addQuestion}
                            saveQuestion={saveQuestionChanges}
                            deleteQuestion={deleteQuestion}
                            swapQuestions={swapQuestions}/>
                </form>
            }

            <FixedElement>
                  <ButtonBar>
                        <button type='button' onClick={()=>{navigate(-1);}}>
                            Back
                        </button>
                      <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>

        </div>
    )
}
