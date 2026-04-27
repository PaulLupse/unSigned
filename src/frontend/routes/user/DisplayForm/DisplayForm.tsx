import type { FormInfo} from "../../../domain/types";
import {delete_form} from "../back-end-connection";
import React from "react";

import {useNavigate, useOutletContext} from "react-router-dom";
import {formInfoSchema} from "../../../domain/schemas";
import {useMutation} from "@tanstack/react-query";
import {BackButton, NavButton} from "../../../components/Buttons/Buttons";
import toast from "react-hot-toast";
import {FormDisplayer} from "../../../components/Form/FormDisplayer";
import ButtonBar from "../../../components/Buttons/ButtonBar/ButtonBar";
import {FixedElement} from "../../../components/FixedElement/FixedElement";

import * as styles from './DisplayForm.module.css'


export function DisplayFrom() {

    const form: FormInfo = formInfoSchema.parse(useOutletContext());
    const navigate = useNavigate();

    const {mutate} = useMutation({
        mutationFn:delete_form,
        onSuccess:()=>{
            toast.success("Form deleted successfully!")
            navigate('/')
        },
        onError:()=>{
            toast.error("Could not delete form . . .")
        }
    })

    async function deleteForm() {
        mutate(form.id)
    }

    const status = form.datePublished?form.dateClosed?"Closed":"Published":"Not published"

    return (

        form &&
        <div className={styles.formFrame}>

            <FormDisplayer name={form.name} questions={form.questions} />

            <FixedElement>

                <div className={styles.statusBar}>
                    <h3>
                        {status}
                    </h3>
                    {
                        status !== "Closed" &&
                        <button>
                            {status=="Published"?"Close":"Publish"}
                        </button>
                    }
                </div>

                <ButtonBar>
                    <BackButton>
                        Back
                    </BackButton>

                    <NavButton to={'keys'}>
                        Distribute keys
                    </NavButton>

                    <NavButton to={'submissions'}>
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