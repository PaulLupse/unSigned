import React, {useEffect, useState} from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {createTemplate} from "src/backend-connection/users";
import type {NewForm, QuestionUnion} from "src/domain/types";
import type {TextQuestion} from "src/domain/types";
import {useNavigate} from "react-router-dom";

import {ElemType, newFormSchema, QuestionType} from "src/domain/schemas";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "src/components/Form/FormEditor/FormEditor";

import 'src/components/Form/CommonFormStyle.css'
import 'src/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './TemplateCreator.module.css'
import {FixedElement} from "src/components/FixedElement/FixedElement"
import Loading from "src/components/Loading";
import {BackButton} from "src/components/Buttons/Buttons";
import {Checkbox} from "src/components/Checkbox/Checkbox";
import {useAuth} from "src/components/AuthProvider";

import {log} from "src/utilities";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function TemplateCreator() {

    const navigate = useNavigate();
    const {user} = useAuth()

    const [loadingProgress, setLoadingProgress] = React.useState(false)

    const {register, formState:{errors}, handleSubmit, control, watch, getValues, setValue} = useForm<NewForm>({defaultValues:{elements:[], name:'New template'}});
    const {append, update, remove, swap} = useFieldArray({control, name:'elements'});
    const formElements = watch("elements");
    const [isOfficial, setIsOfficial] = useState(false)

    const {mutate, isPending} = useMutation({
        mutationFn:createTemplate,
        onSuccess:(formId:string|undefined)=>{
            toast.success("Template created successfully!");
            navigate(`/template/${formId}/view`)
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
                setValue("elements", parseResult.data.elements);
                setValue("name", parseResult.data.name);
            }
        }
        setLoadingProgress(false);
    }, [])


    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {
            text:`Question #${formElements.length+1}`,
            elemType: ElemType.QUESTION,
            questionType:QuestionType.TEXT,
            maxChars:30,
            isOptional:false
        }
        append(newQuestion);
        return formElements.length;
    }

    const swapQuestions = (q1Index:number, q2Index:number)=>{
        if (q1Index >= 0  &&  q2Index >= 0 && q1Index < formElements.length && q2Index < formElements.length)
            swap(q1Index, q2Index)
    }

    const saveQuestionChanges = (questionIndex:number, questionOptions:QuestionUnion) => {
        update(questionIndex, questionOptions);
    }

    const deleteQuestion = (questionIndex:number) => {
        remove(questionIndex)
    }

    const createNewForm:SubmitHandler<NewForm> = async(data:NewForm) => {

        log(data);
        const newForm:NewForm = newFormSchema.parse({
                                name:data.name,
                                questions:data.elements,
                            })
        mutate({templateData:newForm, type:isOfficial?'official':undefined});
    }

    return (
        <div className={style.main}>
            {
                loadingProgress ? <Loading/> :
                <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)}
                                     style={{width: '100%'}}>
                <FormEditor register={register}
                            errors={errors}
                            formElements={formElements}
                            addNewQuestion={addQuestion}
                            saveQuestion={saveQuestionChanges}
                            deleteQuestion={deleteQuestion}
                            swapQuestions={swapQuestions}/>
                </form>
            }

            <FixedElement>
                <ButtonBar>

                    <BackButton>
                        Back
                    </BackButton>

                    {
                        user && (user.isAdmin) &&
                        <Checkbox text={"Official"}
                              checked={isOfficial}
                              setChecked={setIsOfficial}
                              location={'right'} />
                    }


                    <button form={"barosan"}
                            type='submit'
                            className='plain-button'>
                        Done
                    </button>

                </ButtonBar>
            </FixedElement>

        </div>
    )
}
