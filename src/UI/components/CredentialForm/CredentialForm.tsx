import React, {useRef, useState} from 'react';
import './credential-form.css'
import {type SubmitHandler, useForm} from "react-hook-form";
import type {Credentials} from "../../domain/types";
import {zodResolver} from "@hookform/resolvers/zod";
import {credentialsSchema} from "../../domain/schemas";
import FormInputErrorPopup from "../../common/error-popups";
import {replace, useNavigate} from "react-router-dom";
import {type CredentialResult} from "../../user/back-end-connection";
import {useQueryClient} from "@tanstack/react-query";
import {Dialog} from "../Dialog/Dialog";

interface CredentialFormProps {
    type:string
    callback:(username:string, password:string)=>Promise<CredentialResult>
}


export function CredentialForm(props: CredentialFormProps) {

    const {register, handleSubmit, formState:{errors}, setError} = useForm<Credentials>({resolver:zodResolver(credentialsSchema)})
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [passwordInputType, setPasswordInputType] = React.useState('password');

    async function togglePasswordInputType() {
        if(passwordInputType === 'password') {
            setPasswordInputType('text');
            return
        }
        setPasswordInputType('password');
    }

    const [showDialog, setShowDialog] = useState(false);
    const onSubmit:SubmitHandler<Credentials> = async (data:Credentials) => {
        const result:CredentialResult = await props.callback(data.username, data.password)

        if(result.ok) {
            if(props.type == "Login") {
                await queryClient.invalidateQueries({queryKey:['username']})
                navigate('/', {replace:false});
            } else
                setShowDialog(true);
        } else {
            if(typeof result.errorMsg === "object") {

                if(result.errorMsg.username != undefined)
                    setError("username", {
                        type:"manual",
                        message:result.errorMsg.username
                    })

                if(result.errorMsg.password != undefined)
                    setError("password", {
                        type:"manual",
                        message:result.errorMsg.password
                    })
            }
            else
                setError("root", {
                    type:"manual",
                    message:result.errorMsg
                })
        }
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

                {
                    props.type==="Register" &&
                    <Dialog
                        text={"Registered in successfully. Go to login page?"}
                        buttons={[
                            {
                                text:"Cancel",
                                action:()=>{navigate('/')}
                            },
                            {
                                text:"Confirm",
                                action:()=>{navigate('/login')}
                            }
                        ]}
                        open={showDialog} />
                }

            </form>
            <FormInputErrorPopup name={'root'} errors={errors} place={'top'} />
        </div>
    );
}