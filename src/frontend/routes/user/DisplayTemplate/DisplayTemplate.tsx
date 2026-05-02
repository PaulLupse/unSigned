import React, {useCallback} from "react";
import {templateSchema} from "src/frontend/domain/schemas";
import {useNavigate, useOutletContext} from "react-router-dom";
import type {Template} from "src/frontend/domain/types";
import * as style from "./DisplayTemplate.module.css"
import {FormDisplayer} from "src/frontend/components/Form/FormDisplayer";
import {FixedElement} from "src/frontend/components/FixedElement/FixedElement";
import ButtonBar from "src/frontend/components/Buttons/ButtonBar/ButtonBar";
import {NavButton} from "src/frontend/components/Buttons/Buttons";
import {delete_template} from "src/frontend/server/users-server";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function DisplayTemplate() {

    const queryClient = useQueryClient()
    const template:Template = templateSchema.parse(useOutletContext())
    const navigate = useNavigate()

    const deleteMutation = useMutation(
        {
            mutationFn:delete_template,
            onSuccess:()=>{
                toast.success("Template deleted successfully!")
                navigate('/me')
            },
            onError:(error)=>{
                toast.error("Could not delete template: " + error.message)
            }
        }
    )

    const deleteTemplate = useCallback(
        ()=>{
            deleteMutation.mutate({templateId:template.id})
        }, [template]
    )

    return (
        <div className={style.formFrame}>

            <FormDisplayer name={template.name} questions={template.questions} />

            <FixedElement>
                <ButtonBar>

                    <NavButton to={"/me/templates"} onClick={async ()=>{queryClient.removeQueries({queryKey:['template']})}}>
                        Back
                    </NavButton>
                    <NavButton to={`/template/${template.id}/edit`}>
                        Edit
                    </NavButton>
                    <button onClick={deleteTemplate}>
                        Delete
                    </button>
                    <NavButton to={`/form/create?templateId=${template.id}`}>
                        Use template
                    </NavButton>

                </ButtonBar>
            </FixedElement>
        </div>
    )
}