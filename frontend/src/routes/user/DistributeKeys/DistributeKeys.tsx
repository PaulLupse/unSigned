import React, {useCallback, useRef} from "react";
import {type SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import type {Email, FormInfo} from "../../../domain/types";
import {z} from "zod";
import {emailSchema, formInfoSchema} from "../../../domain/schemas";
import {zodResolver} from "@hookform/resolvers/zod";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";
import {useNavigate, useOutletContext} from "react-router-dom";
import {distributeKeys} from "../../../server/users-server";
import {useAlert} from "../../../components/AlertProvider";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as style from './DistributeKeys.module.css'
import {FixedElement} from "src/components/FixedElement/FixedElement";
import ButtonBar from "src/components/Buttons/ButtonBar/ButtonBar";
import {BackButton, NavButton} from "src/components/Buttons/Buttons";


interface EmailsList {
    emails:Email[]
}

const emailsListSchema = z.object({
    emails:z.array(emailSchema).refine((emails) => new Set(emails.map(email=>email.email)).size === emails.length, {
        message: "Emails must be unique",
    }).refine((emails)=>emails.length >= 2, {message: 'Please enter at least two emails.'})
})

function getDefaultValues ():EmailsList {
    return {emails:[{email:''},{email:''}]}
}

export function DistributeKeys() {

    const form: FormInfo = formInfoSchema.parse(useOutletContext());

    const {register, handleSubmit, formState:{errors}, control, watch} = useForm<EmailsList>({resolver:zodResolver(emailsListSchema), defaultValues:getDefaultValues()});
    const {append, remove, fields} = useFieldArray({control, name: "emails"})
    const navigate = useNavigate();
    const {showAlert} = useAlert()

    const distKeyButton = useRef<HTMLButtonElement>(null);

    const toggleDistKeyButton = useCallback(()=>{
        if (distKeyButton.current) distKeyButton.current.disabled = !distKeyButton.current.disabled;
    }, [distKeyButton.current])

    const wrappedDistKeysFn = async(data: any) => {
        await toast.promise(distributeKeys(data),
            {
                loading:'Distributing . . .',
                success:'The keys were distributed successfully!',
                error:(error:Error)=>'Could not distribute keys: ' + error.message
            })
    }

    const {mutate} = useMutation({
        mutationFn:wrappedDistKeysFn,
        onSuccess:()=>{navigate(-1)}
    })

    const onSubmit:SubmitHandler<EmailsList> = async (data:EmailsList)=>{
        showAlert("Are you sure? This action cannot be undone!",
            [
                {text:'No'}, {text:'Yes', action:()=>{mutate({emails:data.emails, formId:form.id}); toggleDistKeyButton()}}
            ])
    }

    const addEmailEntry = () => {
        append({email:''})
    }

    const removeEmailEntry = (index:number) => {
        remove(index);
    }

    return (
        <div className={style.main}>
            <h2>
                Distribute access keys
            </h2>
            <label>
                Access keys will be distributed to the emails you enter here.
            </label>
            <form id={'distKeyForm'} className={style.distKeysForm}
                onSubmit={handleSubmit(onSubmit)}>
                {
                    fields.length>0 &&
                    <ol data-tooltip-id={'emails.root'} className={style.emailsEntryList}>
                    {
                        fields.map((option, index:number)=>{
                            return(
                                <li key={option.id}>
                                    <div className={style.emailInputFrame}>
                                        <input data-tooltip-id={`emails.${index}.email`} size={20} type={'text'} {...register(`emails.${index}.email`)}/>
                                        <FormInputErrorPopup name={`emails.${index}.email`} errors={errors} place={'left'} />

                                        <button type={'button'} onClick={()=>removeEmailEntry(index)}
                                            className={style.deleteButton}>
                                            -
                                        </button>
                                    </div>
                                </li>
                            )
                        })
                    }
                    </ol>
                }


                <FormInputErrorPopup name={'emails.root'} errors={errors} place={'bottom'} />

                <button type={'button'} onClick={()=>addEmailEntry()} className={style.deleteButton}>
                    +
                </button>

            </form>

            <FixedElement>
                <ButtonBar>
                    <NavButton to={`/me/forms/${form.id}/view`}>Back</NavButton>
                    <button ref={distKeyButton} type={'submit'} form={'distKeyForm'}>
                        Distribute
                    </button>
                </ButtonBar>
            </FixedElement>
        </div>
    )
}