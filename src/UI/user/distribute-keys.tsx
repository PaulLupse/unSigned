import React from "react";
import {type SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import type {Email} from "../domain/types";
import {z} from "zod";
import {emailSchema} from "../domain/schemas";
import {zodResolver} from "@hookform/resolvers/zod";
import FormInputErrorPopup from "../common/error-popups";
import {useNavigate} from "react-router-dom";


interface EmailsList {
    emails:Email[]
}

const emailsListSchema = z.object({
    emails:z.array(emailSchema)
})

export function DistributeKeys() {

    const {register, handleSubmit, formState:{errors}, control, watch} = useForm<EmailsList>({resolver:zodResolver(emailsListSchema)});
    const {append, remove, fields} = useFieldArray({control, name: "emails"})
    const navigate = useNavigate();

    const onSubmit:SubmitHandler<EmailsList> = (data:EmailsList)=>{
        console.log(data);
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