import React, {useEffect} from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {add_form, get_template} from "../../../server/users-server";
import type {FormInfo, NewForm} from "../../../domain/types";
import type {TextQuestion, GridQuestion} from "../../../domain/types";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";

import {formInfoSchema, newFormSchema} from "../../../domain/schemas";
import {useMutation, useQuery} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "../../../components/Form/FormEditor/FormEditor";

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
        queryFn:async()=>get_template({templateId:usedTemplateId?usedTemplateId:''}),
        queryKey:['usedTemplate', usedTemplateId],
        enabled: !!usedTemplateId,
        retry:0
    })

    const {register, formState:{errors}, handleSubmit, control, watch, setValue, getValues} = useForm<NewForm>({values:{questions:usedTemplate.data?usedTemplate.data.questions:[], name:'New form'}});
    const {append, update, remove, swap} = useFieldArray({control, name:'questions'});
    const formQuestions = watch("questions");

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
        mutationFn:add_form,
        onSuccess:(formId:string|undefined)=>{
            toast.success("Form added successfully!");
            navigate(`/me/forms/${formId}/view`)
        },
        onError:(error)=>{
            toast.error("Could not create form. " + error?.message);
        },
        retry:0,
    })

    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {text:`Question #${formQuestions.length+1} text`, type:"text", maxChars:30, isOptional:false}
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
        mutate(newForm);
    }

    return (
        <div className={style.main}>

            {
                usedTemplate.isLoading || loadingProgress ? <Loading /> :
                <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)}>
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
                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <NavButton to={"/me/forms"}>
                            Back
                        </NavButton>

                        <ButtonWithMenu location={'top'} buttonText={'Load template'}
                                      options={[
                                          {text:'From public templates', action:()=>{navigate('/templates/public')}},
                                          {text:'From official templates', action:()=>{navigate('/templates/official')}},
                                          {text:'From my templates', action:()=>{navigate('/templates/mine')}}
                                      ]} />

                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>
            
        </div>
    )
}
