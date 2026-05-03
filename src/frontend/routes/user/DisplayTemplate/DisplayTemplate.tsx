import React, {useCallback} from "react";
import {templateSchema, userSchema} from "src/frontend/domain/schemas";
import {useNavigate, useOutletContext} from "react-router-dom";
import type {Template, User} from "src/frontend/domain/types";
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
    const context = useOutletContext<{template:Template, user:User}>()

    const template:Template = templateSchema.parse(context.template)
    const user:User = userSchema.parse(context.user)

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

                    <NavButton to={`/templates/${template.status=='private'?'mine':template.status}`} onClick={async ()=>{queryClient.removeQueries({queryKey:['template']})}}>
                        Back
                    </NavButton>
                    {
                        ((template.status=='private' && user.id === template.ownerId) || (template.status=='official' && user?.isAdmin)) &&
                        <>
                            <NavButton to={`/templates/${template.id}/edit`}>
                                Edit
                            </NavButton>
                            <button onClick={deleteTemplate}>
                                Delete
                            </button>
                        </>
                    }

                    <NavButton to={`/form/create?templateId=${template.id}`}>
                        Use template
                    </NavButton>

                </ButtonBar>
            </FixedElement>
        </div>
    )
}