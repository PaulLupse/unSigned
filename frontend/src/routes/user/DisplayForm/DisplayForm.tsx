import type { FormInfo} from "../../../domain/types";
import {close_form, delete_form, publish_form} from "../../../server/users-server";
import React, {useCallback, useEffect} from "react";

import {useNavigate, useOutletContext} from "react-router-dom";
import {formInfoSchema} from "../../../domain/schemas";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {BackButton, NavButton} from "../../../components/Buttons/Buttons";
import toast from "react-hot-toast";
import {FormDisplayer} from "../../../components/Form/FormDisplayer";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FixedElement} from "../../../components/FixedElement/FixedElement";

import * as styles from './DisplayForm.module.css'
import {useAlert} from "src/components/AlertProvider";


export function DisplayFrom() {

    const {showAlert} = useAlert()

    const queryClient = useQueryClient();

    const form: FormInfo = formInfoSchema.parse(useOutletContext());
    const [formStatus, setFormStatus] = React.useState<string>();
    const navigate = useNavigate();

    useEffect(()=>{
        form.datePublished?
            form.dateClosed?
                setFormStatus("Closed")
                :
                setFormStatus("Published")
            :
            setFormStatus("Not published")
    }, [form])

    const {mutate} = useMutation({
        mutationFn:delete_form,
        onSuccess:()=>{
            toast.success("Form deleted successfully!")
            navigate('/me/forms')
        },
        onError:()=>{
            toast.error("Could not delete form . . .")
        }
    })

    async function deleteForm() {
        showAlert("Are you sure? This action cannot be undone!", [
                {text:'No'},
                {
                    text:'Yes',
                    action:()=>mutate(form.id)
                }])
    }

    const publishForm = useMutation({
        mutationFn:publish_form,
        onSuccess:async ()=>{
            setFormStatus(()=>"Published")
            await queryClient.invalidateQueries({queryKey:['form']});
            toast.success("Form published successfully!")
        }, onError:(error)=>{
            toast.error(error.message)
        }
    })

    const closeForm = useMutation({
        mutationFn:close_form,
        onSuccess:async ()=>{
            setFormStatus(()=>"Closed")
            await queryClient.invalidateQueries({queryKey:['form']});
            toast.success("Form closed successfully!")
        }, onError:(error)=>{
            toast.error(error.message)
        }
    })

    const statusButtonHandler = useCallback(() => {

        if (formStatus !== "Published") {
            showAlert("Are you sure? You won't be able to modify the form afterwards.",
                [{text:"No"}, {text:"Yes", action:()=>{publishForm.mutate(form.id)}}]
            )
        } else {
            showAlert("Are you sure? People won't be able to make any submissions afterwards.",
                [{text:"No"}, {text:"Yes", action:()=>{closeForm.mutate(form.id)}}])
        }
    }, [formStatus])

    return (

        form &&
        <div className={styles.formFrame}>

            <FormDisplayer name={form.name} questions={form.questions} />

            <FixedElement>

                <div className={styles.statusBar}>
                    <h3>
                        {formStatus}
                    </h3>
                    {
                        formStatus !== "Closed" &&
                        <button onClick={statusButtonHandler}>
                            {formStatus=="Published"?"Close":"Publish"}
                        </button>
                    }
                </div>

                <ButtonBar>
                    <NavButton to={`/me/forms`}  onClick={async ()=>{queryClient.removeQueries({queryKey:['form']})}}>
                        Back
                    </NavButton>

                    {
                        formStatus=="Not published"&&
                        <NavButton to={`/me/forms/${form.id}/edit`}>
                            Edit form
                        </NavButton>
                    }
                    {
                        formStatus!="Closed"&&
                        <NavButton to={`/me/forms/${form.id}/keys`}>
                            Distribute keys
                        </NavButton>
                    }

                    <NavButton to={`/me/forms/${form.id}/submissions`}>
                        See results
                    </NavButton>

                    <button onClick={deleteForm}>
                        Delete
                    </button>
                </ButtonBar>

            </FixedElement>
        </div>
    )
}