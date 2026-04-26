import React from "react";
import {
    useForm,
    type SubmitHandler,
    useFieldArray,
} from "react-hook-form";
import {add_form} from "../back-end-connection";
import type {NewForm} from "../../../domain/types";
import type {TextQuestion, GridQuestion} from "../../../domain/types";
import {type NavigateFunction, useNavigate} from "react-router-dom";

import {newFormSchema} from "../../../domain/schemas";
import {useAlert} from "../../../components/AlertProvider";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {QuestionEditor} from "../../../components/Form/QuestionEditor/QuestionEditor";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FormEditor} from "../../../components/Form/FormEditor/FormEditor";

import '../../../components/Form/CommonFormStyle.css'
import '../../../components/Form/QuestionEditor/QuestionEditor.css'
import * as style from './FormCreator.module.css'
import {FixedElement} from "../../../components/FixedElement/FixedElement";

// Componenta de baza a creatorului de formulare.
// Printre altele, afiseaza un preview al formularului.
export default function FormCreator() {

    const [displayQuestionEditor, setDisplayQuestionEditor] = React.useState(false);
    const [questionToBeEditedIndex, setQuestionToBeEditedIndex] = React.useState<number>();

    const navigate = useNavigate();
    const {showAlert} = useAlert();

    const {register, formState:{errors}, handleSubmit, control, watch} = useForm<NewForm>({defaultValues:{questions:[]}});
    const {append, remove, update} = useFieldArray({control, name:'questions'});
    const formQuestions = watch("questions");

    const {mutate} = useMutation({
        mutationFn:add_form,
        onSuccess:()=>{
            toast.success("Form added successfully!");
            navigate("/")
        },
        onError:(error)=>{
            toast.error("Could not create form. " + error?.message);
        }
    })

    function deleteQuestionHandler (questionIndex:number):void {
        showAlert("Are you sure you want to delete this question?",
            [{text:"No"}, {text:"Yes", action:()=>{remove(questionIndex)}}]
        )
    }

    function editQuestionHandler (quesionIndex:number):void {
        if (!displayQuestionEditor) setQuestionToBeEditedIndex(quesionIndex);
        else showAlert("Cannot edit a question while editing another!", [{text:'Dammit'}])
    }

    function displayQuestionEditorHandler ():void {
        if (!displayQuestionEditor) setDisplayQuestionEditor(true);
        else showAlert("Cannot add a new question while edititng another!", [{text:'Dammit'}])
    }

    function editQuestion (updatedQuestion:TextQuestion|GridQuestion) {
        if (questionToBeEditedIndex) update(questionToBeEditedIndex, updatedQuestion)
        else alert("HOLD ON!")
    }

    const addQuestion = (question:TextQuestion|GridQuestion) => {
        append(question);
    }

    const createNewForm:SubmitHandler<NewForm> = async(data:NewForm) => {

        const newForm:NewForm = newFormSchema.parse({
                                formName:data.formName,
                                questions:data.questions,
                            })
        mutate(newForm);
    }

    return (
        <>
            <form onSubmit={handleSubmit(createNewForm)} className={style.formAndEditor}>
                <FormEditor register={register}
                            errors={errors}
                            formQuestions={formQuestions}
                            deleteQuestionHandler={deleteQuestionHandler}
                            editQuestionHandler={editQuestionHandler} />

                {
                    displayQuestionEditor &&
                    <QuestionEditor setDisplayQuestionEditor={setDisplayQuestionEditor}
                        action={questionToBeEditedIndex?editQuestion:addQuestion}
                    />
                }


            </form>
            <FixedElement>
                  <ButtonBar>
                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <button type='button' onClick={()=>{navigate(-1);}}>
                            Back
                        </button>

                        <button type='button' onClick={()=>{ displayQuestionEditorHandler();}} >
                            Add new question
                        </button>

                        {/*La apasarea butonului se creeaza un nou chestionar avand intrebarile adaugate*/}
                        <input type='submit' value='Create form' className='plain-button'/>
                  </ButtonBar>
            </FixedElement>
        </>
    )
}
