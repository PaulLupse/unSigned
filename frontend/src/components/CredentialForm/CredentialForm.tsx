import React, {useCallback, useRef} from 'react';
import './credential-form.css'
import {type SubmitHandler, useForm} from "react-hook-form";
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {zodResolver} from "@hookform/resolvers/zod";
import type {Credentials} from "src/domain/types";
import {credentialsSchema} from "src/domain/schemas";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";
import {CredentialError} from "src/utilities/Utilities";

interface CredentialFormProps {
    type:string
    callback: ({ username, password }:{username: string, password: string})=>Promise<void>
}

export function CredentialForm(props: CredentialFormProps) {

    const {register, handleSubmit, formState:{errors}, setError} = useForm<Credentials>({resolver:zodResolver(credentialsSchema)})
    const navigate = useNavigate()
    const qC = useQueryClient();
    const [passwordInputType, setPasswordInputType] = React.useState('password');

    const submitButton = useRef<HTMLButtonElement>(null);

    const toggleSubmitButton = useCallback(()=>
    {
        if (submitButton.current)
            submitButton.current.disabled = !submitButton?.current.disabled}, [submitButton]
    )

    const {mutate} = useMutation({
        mutationFn:props.callback,
        onSuccess: async ()=>{
            if(props.type === "Login") {

                await qC.invalidateQueries({queryKey:['username'], refetchType:'all'})
                await qC.refetchQueries({queryKey:['user']})
                navigate('/me', {replace:true})

            } else {
                navigate('/login', {replace:true})
            }
        },
        onError: (error)=>{
            toggleSubmitButton()
            if(error instanceof CredentialError) {
                if(error.detail.username !== '')
                    setError("username", {
                        type:"manual",
                        message:error.detail.username
                    })
                if(error.detail.password !== '')
                    setError("password", {
                        type:"manual",
                        message:error.detail.password
                    })
            }
        }
    })

    async function togglePasswordInputType() {
        if(passwordInputType === 'password') {
            setPasswordInputType('text');
            return
        }
        setPasswordInputType('password');
    }

    const onSubmit:SubmitHandler<Credentials> = async (data:Credentials) => {
        toggleSubmitButton();
        mutate({username:data.username, password:data.password})
    }


    return (
        <div data-tooltip-id={"root"} className={"frame"}>
            <form onSubmit={handleSubmit(onSubmit)}>

                <h2 style={{textAlign:'center', marginBottom:'25px'}}>
                    {props.type}
                </h2>

                <input data-tooltip-id={'username'} {...register('username')} style={{marginBottom: '10px'}} placeholder='Username'/>
                <FormInputErrorPopup name={"username"} errors={errors} place={"left"} />

                <div style={{marginBottom: '10px', display:'flex'}}>

                    <input data-tooltip-id={"password"} {...register('password')} placeholder='Password' type={passwordInputType}
                        style={{flexGrow:'1'}}/>
                    <FormInputErrorPopup name={"password"} errors={errors} place={"left"} />

                    <button type={'button'} onClick={togglePasswordInputType}
                        style={{marginLeft:'10px'}}>
                        {passwordInputType==='password'?'Show':'Hide'}
                    </button>

                </div>

                <div style={{display:'grid', alignItems:'center', justifyItems:'center'}}>
                    <button ref={submitButton} type={'submit'}>
                        Submit
                    </button>
                </div>

            </form>
            <FormInputErrorPopup name={'root'} errors={errors} place={'top'} />
        </div>
    );
}