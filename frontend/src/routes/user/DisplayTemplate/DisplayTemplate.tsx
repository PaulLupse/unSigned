import React, {useCallback} from "react";
import {templateSchema, userSchema} from "src/domain/schemas";
import {useNavigate, useOutletContext} from "react-router-dom";
import type {Template, User} from "src/domain/types";
import * as style from "./DisplayTemplate.module.css"
import {FormDisplayer} from "src/components/Form/FormDisplayer";
import {FixedElement} from "src/components/FixedElement/FixedElement";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {NavButton} from "src/components/Buttons/Buttons";
import {deleteTemplate} from "src/server/users-server";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {useAuth} from "src/components/AuthProvider";

export default function DisplayTemplate() {

    const queryClient = useQueryClient()
    const context = useOutletContext<{template:Template}>()
    const {user} = useAuth()

    const template:Template = templateSchema.parse(context.template)

    const navigate = useNavigate()

    const deleteMutation = useMutation(
        {
            mutationFn:deleteTemplate,
            onSuccess:()=>{
                toast.success("Template deleted successfully!")
                navigate('/templates/private')
            },
            onError:(error)=>{
                toast.error("Could not delete template: " + error.message)
            }
        }
    )

    const deleteButtonHandler = useCallback(
        ()=>{
            deleteMutation.mutate({templateId:template.id})
        }, [template]
    )

    return (
        <div className={style.formFrame}>

            <FormDisplayer name={template.name} questions={template.questions} />

            <FixedElement>
                <ButtonBar>

                    <NavButton to={`/templates/${template.status}`} onClick={async ()=>{queryClient.removeQueries({queryKey:['template']})}}>
                        Back
                    </NavButton>
                    {
                        ((template.status=='private' && user?.id === template.ownerId) || (template.status=='official' && user?.isAdmin)) &&
                        <>
                            <NavButton to={`/templates/${template.id}/edit`}>
                                Edit
                            </NavButton>
                            <button onClick={deleteButtonHandler}>
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