import React from "react";
import {type SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import type {Email, FormInfo} from "../../domain/types";
import {z} from "zod";
import {emailSchema, formInfoSchema} from "../../domain/schemas";
import {zodResolver} from "@hookform/resolvers/zod";
import FormInputErrorPopup from "../../common/error-popups";
import {useNavigate, useOutletContext} from "react-router-dom";
import {distribute_keys} from "./back-end-connection";
import {useAlert} from "../../components/AlertProvider";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";


interface EmailsList {
    emails:Email[]
}

const emailsListSchema = z.object({
    emails:z.array(emailSchema)
})

export function DistributeKeys() {

    const form: FormInfo = formInfoSchema.parse(useOutletContext());

    const {register, handleSubmit, formState:{errors}, control, watch} = useForm<EmailsList>({resolver:zodResolver(emailsListSchema)});
    const {append, remove, fields} = useFieldArray({control, name: "emails"})
    const navigate = useNavigate();
    const {showAlert} = useAlert()

    const {mutate} = useMutation({
        mutationFn:distribute_keys,
        onSuccess:()=>{
            toast.success("Keys distributed successfully!")
        },
        onError:(error)=>{
            toast.error("Could not distribute keys :(");
        }
    })

    const onSubmit:SubmitHandler<EmailsList> = async (data:EmailsList)=>{
        const result = await distribute_keys({emails:data.emails, formId:form.id});
    }

    const addEmailEntry = () => {
        append({email:''})
    }

    const removeEmailEntry = (index:number) => {
        remove(index);
    }

    return (
        <div style={{
            padding:"10px",
            display:"flex",
            justifyContent:'center',
            alignItems:'center',
            flexDirection:'column'
        }}>
            <h2 style={{textAlign:'center'}}>
                Distribute access keys
            </h2>
            <label>
                Access keys will be distributed to the emails you enter here.
            </label>
            <form style={{
                display:"flex",
                flexDirection:'column',
                alignItems:'center',
                justifyContent:'center',
                gap:'10px'
            }}
                onSubmit={handleSubmit(onSubmit)}>
                <ol style={{
                    display:"flex",
                    flexDirection:'column',
                    gap:'10px'
                }}>
                {
                    fields.map((option, index:number)=>{
                        return(
                            <li key={option.id}>
                                <div style={{
                                    display:'grid',
                                    gridTemplateColumns:'1fr auto',
                                    gap:'10px'
                                }}>
                                    <input data-tooltip-id={`emails.${index}.email`} size={20} type={'text'} {...register(`emails.${index}.email`)}
                                    style={{
                                        width:'20rem'
                                    }}/>
                                    <FormInputErrorPopup name={`emails.${index}.email`} errors={errors} place={'left'} />

                                    <button type={'button'} onClick={()=>removeEmailEntry(index)} style={{
                                        aspectRatio:'1/1',
                                        padding:'5px',
                                    }}>
                                        -
                                    </button>
                                </div>

                            </li>
                        )
                    })
                }
                </ol>

                <button type={'button'} onClick={()=>addEmailEntry()} style={{
                    aspectRatio:'1/1',
                    padding:'5px'
                }}>
                    +
                </button>

                <div style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(2, 1fr)'
                }}>
                    <button onClick={()=>{navigate(-1)}}>
                        Back
                    </button>
                    <button type={'submit'}>
                        Distribute
                    </button>
                </div>

            </form>
        </div>
    )
}