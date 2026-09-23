import React, {useEffect} from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {addForm, getTemplate} from "src/backend-connection/users";
import type {NewForm, QuestionUnion} from "src/domain/types";
import type {TextQuestion} from "src/domain/types";
import {useNavigate, useSearchParams} from "react-router-dom";

import {ElemType, newFormSchema, QuestionType} from "src/domain/schemas";
import {useMutation, useQuery} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "src/components/Form/FormEditor/FormEditor";

import 'src/components/Form/CommonFormStyle.css'
import 'src/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './FormCreator.module.css'
import {FixedElement} from "src/components/FixedElement/FixedElement"
import {NavButton} from "src/components/Buttons/Buttons";
import ButtonWithMenu from "src/components/FloatingMenu/FloatingMenu";
import Loading from "src/components/Loading";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function FormCreator() {

    const navigate = useNavigate();
    const [params] = useSearchParams();
    const usedTemplateId:string|null = params.get("templateId");
    const [loadingProgress, setLoadingProgress] = React.useState<boolean>(true);

    // daca este folosit parametrul de query 'useTemplateId', atunci se incearca preluarea template-ului cu acel id
    // si folosirea intrebarilor acestuia ca si valori default pentru formular
    const usedTemplate = useQuery({
        queryFn:async()=>getTemplate({templateId:usedTemplateId?usedTemplateId:''}),
        queryKey:['usedTemplate', usedTemplateId],
        enabled: !!usedTemplateId,
        retry:0
    })

    const {register, formState:{errors}, handleSubmit, control, watch, setValue, getValues} = useForm<NewForm>({values:{elements:usedTemplate.data?usedTemplate.data.elements:[], name:'New form'}});
    const {append, update, remove, swap} = useFieldArray({control, name:'elements'});
    const elements = watch("elements");

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

    // efect ce salveaza progresul curent in session storage
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

    const {mutate} = useMutation({
        mutationFn:addForm,
        onSuccess:(formId:string|undefined)=>{
            toast.success("Form added successfully!");
            navigate(`/form/${formId}/view`)
        },
        onError:(error)=>{
            toast.error("Could not create form. " + error?.message);
        },
        retry:0,
    })

    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {
            elemType: ElemType.QUESTION,
            questionType:QuestionType.TEXT,
            text:`Question #${elements.length+1} text`,
            maxChars:30,
            isOptional:false
        }
        append(newQuestion);
        return elements.length;
    }

    const swapQuestions = (q1Index:number, q2Index:number)=>{
        if (q1Index >= 0  &&  q2Index >= 0 && q1Index < elements.length && q2Index < elements.length)
            swap(q1Index, q2Index)
    }

    const saveQuestionChanges = (questionIndex:number, questionOptions:QuestionUnion) => {
        update(questionIndex, questionOptions);
    }

    const deleteQuestion = (questionIndex:number) => {
        remove(questionIndex)
    }

    const createNewForm:SubmitHandler<NewForm> = async(data:NewForm) => {

        const newForm:NewForm = newFormSchema.parse({
                                name:data.name,
                                elements:data.elements,
                            })
        mutate(newForm);
    }

    return (
        <div className={style.main}>

            {
                usedTemplate.isLoading || loadingProgress ? <Loading /> :
                <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)}>
                    <FormEditor register={register}
                                errors={errors}
                                formElements={elements}
                                addNewQuestion={addQuestion}
                                saveQuestion={saveQuestionChanges}
                                deleteQuestion={deleteQuestion}
                                swapQuestions={swapQuestions}/>
                </form>
            }

            <FixedElement>
                  <ButtonBar>
                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <NavButton to={"/me/forms"}>
                            Back
                        </NavButton>

                        <ButtonWithMenu location={'top'} buttonText={'Load template'}
                                      options={[
                                          {text:'From public templates', action:()=>{navigate('/templates/public')}},
                                          {text:'From official templates', action:()=>{navigate('/templates/official')}},
                                          {text:'From my templates', action:()=>{navigate('/me/templates')}}
                                      ]} />

                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>
            
        </div>
    )
}
