import React, {useEffect, useMemo} from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {updateForm} from "src/backend-connection/users";
import type {FormInfo, NewForm, QuestionUnion} from "src/domain/types";
import type {TextQuestion} from "src/domain/types";
import {useNavigate, useOutletContext} from "react-router-dom";

import {ElemType, formSchema, newFormSchema, QuestionType} from "src/domain/schemas";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "src/components/Form/FormEditor/FormEditor";

import 'src/components/Form/CommonFormStyle.css'
import 'src/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './EditForm.module.css'
import {FixedElement} from "src/components/FixedElement/FixedElement"
import {NavButton} from "src/components/Buttons/Buttons";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function EditForm() {

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // luam datele despre chestionar de la componenta parent UpdateForm, care da fetch la chestionar

    const context = useOutletContext()

    const currentForm:FormInfo|undefined = useMemo(()=>{
        const result = formSchema.safeParse(context);
        if(!result.success) {
            toast.error("Unexpected error")
            return undefined
        }
        if (result.data?.dateOpened) {
            toast.error("Published forms cannot be edited!")
            return undefined
        }
        return result.data;
    }, [context])

    useEffect(()=>{if(!currentForm)navigate(`/me/forms`)}, [currentForm])

    const {register, formState:{errors}, handleSubmit, control, watch} = useForm<NewForm>({defaultValues:{elements:currentForm?.elements, name:currentForm?.name}});

    const {append, update, remove, swap} = useFieldArray({control, name:'elements'});
    const formElements = watch("elements");

    const {mutate} = useMutation({
        mutationFn:updateForm,
        onSuccess:async ()=>{
            toast.success("Form updated successfully!");
            await queryClient.invalidateQueries({queryKey:['form']})
            navigate(`/form/${currentForm?.id}/view`)
        },
        onError:(error)=>{
            toast.error("Could not update form. " + error?.message);
        }
    })


    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {
            text:"",
            elemType:ElemType.QUESTION,
            questionType:QuestionType.TEXT,
            maxChars:30,
            isOptional:false}
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

        const newForm:NewForm = newFormSchema.parse({
                                name:data.name,
                                questions:data.elements,
                            })
        mutate({newFormData:newForm, formId:currentForm?currentForm.id:'' });
    }

    return (
        currentForm &&
        <div className={style.main}>
            <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)} style={{width:'100%'}}>
                <FormEditor register={register}
                            errors={errors}
                            formElements={formElements}
                            addNewQuestion={addQuestion}
                            saveQuestion={saveQuestionChanges}
                            deleteQuestion={deleteQuestion}
                            swapQuestions={swapQuestions}/>
            </form>

            <FixedElement>
                  <ButtonBar>
                      <NavButton to={`/form/${currentForm?.id}/view`}>Cancel</NavButton>

                      <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>

        </div>
    )
}
