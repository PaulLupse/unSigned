import React from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {updateTemplate} from "src/backend-connection/users";
import {useNavigate, useOutletContext} from "react-router-dom";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "src/utilities/toast";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "src/components/Form/FormEditor/FormEditor";

import 'src/components/Form/CommonFormStyle.css'
import 'src/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './EditTemplate.module.css'
import {FixedElement} from "src/components/FixedElement/FixedElement"
import {NavButton} from "src/components/Buttons/Buttons";
import {ElemType, type NewForm, QuestionType, type Template, type TextQuestion} from "src/client/types.gen";
import {zNewForm, zTemplate} from "src/client/zod.gen";
import type {QuestionUnion} from "src/domain/types";
import {zodResolver} from "@hookform/resolvers/zod";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function EditTemplate() {

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {template} = useOutletContext<{template:Template}>()
    
    if(!template) {
        toast.error("No template received . . .");
        navigate('/me');
    }

    const {register, formState:{errors}, handleSubmit, control, watch} =
        useForm<NewForm>({defaultValues:{elements:template?.elements, title:template?.title},
        resolver:zodResolver(zNewForm)});

    const {append, update, remove, swap} = useFieldArray({control, name:'elements'});
    const formQuestions = watch("elements");

    const {mutate} = useMutation({
        mutationFn:updateTemplate,
        onSuccess:async ()=>{
            toast.success("Template updated successfully!");
            await queryClient.invalidateQueries({queryKey:['template']})
            navigate(`/template/${template?.id}/view`)
        },
        onError:(error)=>{
            toast.error(error?.message);
        }
    })


    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {text:"", questionType:QuestionType.TEXT, maxChars:30, isOptional:false, elemType:ElemType.QUESTION}
        append(newQuestion);
        return formQuestions.length;
    }

    const swapQuestions = (q1Index:number, q2Index:number)=>{
        if (q1Index >= 0  &&  q2Index >= 0 && q1Index < formQuestions.length && q2Index < formQuestions.length)
            swap(q1Index, q2Index)
    }

    const saveQuestionChanges = (questionIndex:number, questionOptions:QuestionUnion) => {
        update(questionIndex, questionOptions);
    }

    const deleteQuestion = (questionIndex:number) => {
        remove(questionIndex)
    }

    const createNewForm:SubmitHandler<NewForm> = async(data:NewForm) => {
        
        mutate({newTemplateData:data, templateId:template?template.id:''});
    }

    return (
        <div className={style.main}>
            <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)} style={{width:'100%'}}>
                <FormEditor register={register}
                            errors={errors}
                            formElements={formQuestions}
                            addNewQuestion={addQuestion}
                            saveQuestion={saveQuestionChanges}
                            deleteQuestion={deleteQuestion}
                            swapQuestions={swapQuestions}/>
            </form>

            <FixedElement>
                  <ButtonBar>
                      <NavButton to={`/template/${template?.id}/view`} >Cancel</NavButton>
                      <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>

        </div>
    )
}
