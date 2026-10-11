import React, {useCallback} from "react";
import {useNavigate, useOutletContext} from "react-router-dom";

import * as style from "./DisplayTemplate.module.css"
import {FormDisplayer} from "src/components/Form/FormDisplayer";
import {FixedElement} from "src/components/FixedElement/FixedElement";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {NavButton} from "src/components/Buttons/Buttons";
import {deleteTemplate} from "src/backend-connection/users";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {useAuth} from "src/components/AuthProvider";
import {type Form, type Template, TemplateType} from "src/domain/types";
import {zTemplate} from "src/domain/schemas";

export default function DisplayTemplate() {

    const queryClient = useQueryClient()
    const context = useOutletContext<{template:Template}>()
    const {user} = useAuth()

    const template:Template = zTemplate.parse(context.template)

    const navigate = useNavigate()

    const deleteMutation = useMutation(
        {
            mutationFn:deleteTemplate,
            onSuccess:()=>{
                toast.success("Template deleted successfully!")
                navigate('/me/templates')
            },
            onError:(error)=>{
                toast.error(error.message)
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

            <FormDisplayer form={template} />

            <FixedElement>
                <ButtonBar>

                    <NavButton to={template.status!=="private"?`/templates/${template.status}`:"/me/templates"} onClick={async ()=>{queryClient.removeQueries({queryKey:['template']})}}>
                        Back
                    </NavButton>
                    {
                        ((template.status=='private' && user?.id === template.ownerId) || (template.status==TemplateType.OFFICIAL && user?.isAdmin)) &&
                        <>
                            <NavButton to={`/template/${template.id}/edit`}>
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