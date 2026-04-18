import React, {useRef, useState} from 'react';
import './credential-form.css'
import {type SubmitHandler, useForm} from "react-hook-form";
import {useNavigate} from "react-router-dom";
import {QueryClient, useMutation} from "@tanstack/react-query";
import {zodResolver} from "@hookform/resolvers/zod";
import type {Credentials} from "../../domain/types";
import {credentialsSchema} from "../../domain/schemas";
import FormInputErrorPopup from "../../common/error-popups";
import toast from "react-hot-toast";
import {CredentialError} from "../../Utilities";

interface CredentialFormProps {
    type:string
    callback: ({ username, password }:{username: string, password: string})=>Promise<void>
}


export function CredentialForm(props: CredentialFormProps) {

    const {register, handleSubmit, formState:{errors}, setError} = useForm<Credentials>({resolver:zodResolver(credentialsSchema)})
    const navigate = useNavigate()

    const queryClient = new QueryClient()

    const [passwordInputType, setPasswordInputType] = React.useState('password');

    const {mutate} = useMutation({
        mutationKey:['username'],
        mutationFn:props.callback,
        onSuccess: async ()=>{
            if(props.type === "Login") {
                await queryClient.invalidateQueries({queryKey:['username']})
                toast.success("Logged in succesfully.")
                navigate('/', {replace:true})

            } else {
                toast.success("Registered succesfully. Redirecting to login page . . .")
                navigate('/login', {replace:true})
            }
        },
        onError: (error)=>{
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
            } else if(error)
                toast.error(`Could not ${props.type=="Login"?"login":"register"}: ` + error.message);
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
        console.log('a');
        mutate({username:data.username, password:data.password})
    }


    return (
        <div data-tooltip-id={"root"} className={"frame"}>
            <form onSubmit={handleSubmit(onSubmit)}>

                <h2 style={{textAlign:'center'}}>
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
                    <button type={'submit'}>
                        Submit
                    </button>
                </div>

            </form>
            <FormInputErrorPopup name={'root'} errors={errors} place={'top'} />
        </div>
    );
}