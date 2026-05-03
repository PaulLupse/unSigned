import React, {useContext, useEffect, useMemo} from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {add_form, auto_login, get_form, update_form} from "../../../server/users-server";
import type {FormInfo, NewForm} from "../../../domain/types";
import type {TextQuestion, GridQuestion} from "../../../domain/types";
import {useNavigate, useOutletContext} from "react-router-dom";

import {formInfoSchema, newFormSchema} from "../../../domain/schemas";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "../../../components/Form/FormEditor/FormEditor";

import 'src/frontend/components/Form/CommonFormStyle.css'
import 'src/frontend/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/frontend/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './EditForm.module.css'
import {FixedElement} from "src/frontend/components/FixedElement/FixedElement"
import {NavButton} from "src/frontend/components/Buttons/Buttons";
import ButtonWithMenu from "src/frontend/components/FloatingMenu/FloatingMenu";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function EditForm() {

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // luam datele despre chestionar de la componenta parent UpdateForm, care da fetch la chestionar

    const context = useOutletContext()

    const parseResult = useMemo(()=>{
        const result = formInfoSchema.safeParse(context);
        if(!result.success) {
            toast.error("Unexpected error")
            return undefined
        }
        if (result.data?.datePublished) {
            toast.error("Published forms cannot be edited!")
            return undefined
        }
        return result;
    }, [context])

    useEffect(()=>{if(!parseResult)navigate(`/me/forms`)}, [parseResult])

    const {register, formState:{errors}, handleSubmit, control, watch} = useForm<NewForm>({defaultValues:{questions:parseResult?.data?.questions, name:parseResult?.data?.name}});

    const {append, update, remove, swap} = useFieldArray({control, name:'questions'});
    const formQuestions = watch("questions");

    const {mutate} = useMutation({
        mutationFn:update_form,
        onSuccess:async ()=>{
            toast.success("Form updated successfully!");
            await queryClient.invalidateQueries({queryKey:['form']})
            navigate(`/me/forms/${parseResult?.data?.id}/view`)
        },
        onError:(error)=>{
            toast.error("Could not update form. " + error?.message);
        }
    })


    const addQuestion = ():number => {
        const newQuestion:TextQuestion = {text:"", type:"text", maxChars:30, isOptional:false}
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
        mutate({newFormData:newForm, formId:parseResult?.data?parseResult.data.id:'' });
    }

    return (
        parseResult &&
        <div className={style.main}>
            <form id={"barosan"} className={style.formFrame} onSubmit={handleSubmit(createNewForm)} style={{width:'100%'}}>
                <FormEditor register={register}
                            errors={errors}
                            formQuestions={formQuestions}
                            addNewQuestion={addQuestion}
                            saveQuestion={saveQuestionChanges}
                            deleteQuestion={deleteQuestion}
                            swapQuestions={swapQuestions}/>
            </form>

            <FixedElement>
                  <ButtonBar>
                      <NavButton to={`/me/forms/${parseResult?.data}/view`}>Cancel</NavButton>

                      <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>

        </div>
    )
}
