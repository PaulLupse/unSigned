import React from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {update_template} from "../../../server/users-server";
import type {NewForm, Template, User} from "../../../domain/types";
import type {TextQuestion, GridQuestion} from "../../../domain/types";
import {useNavigate, useOutletContext} from "react-router-dom";

import {newFormSchema, templateSchema} from "../../../domain/schemas";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "../../../components/Form/FormEditor/FormEditor";

import 'src/components/Form/CommonFormStyle.css'
import 'src/components/Form/QuestionEditor/QuestionEditor.css'
import 'src/components/Form/QuestionDisplayer/QuestionDisplayer.module.css'
import * as style from './EditTemplate.module.css'
import {FixedElement} from "src/components/FixedElement/FixedElement"
import {NavButton} from "src/components/Buttons/Buttons";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function EditForm() {

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const context = useOutletContext<{template:Template, user:User}>()

    // luam datele despre chestionar de la componenta parent UpdateForm, care da fetch la chestionar
    const parseResult = templateSchema.safeParse(context.template);
    if(!parseResult.success) {
        toast.error("Error when parsing form . . .");
        navigate('/me');
    }

    const {register, formState:{errors}, handleSubmit, control, watch} =
        useForm<NewForm>({defaultValues:{questions:parseResult.data?.questions, name:parseResult.data?.name}});

    const {append, update, remove, swap} = useFieldArray({control, name:'questions'});
    const formQuestions = watch("questions");

    const {mutate} = useMutation({
        mutationFn:update_template,
        onSuccess:async ()=>{
            toast.success("Template updated successfully!");
            await queryClient.invalidateQueries({queryKey:['template']})
            navigate(`/templates/${parseResult.data?.id}/view`)
        },
        onError:(error)=>{
            toast.error("Could not update template. " + error?.message);
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
        mutate({newTemplateData:newForm, templateId:parseResult.data?parseResult.data.id:''});
    }

    return (
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
                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                      <NavButton to={`/templates/${parseResult.data?.id}/view`} >Cancel</NavButton>
                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                      <button form={"barosan"} type='submit' className='plain-button'>Done</button>
                  </ButtonBar>
            </FixedElement>

        </div>
    )
}
