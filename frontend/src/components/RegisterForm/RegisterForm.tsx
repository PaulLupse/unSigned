import React, {type ReactNode, use, useCallback, useRef, useState} from 'react';
import {type FieldErrors, type SubmitHandler, useForm, type UseFormRegister} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {emailSchema, registerData} from "src/domain/schemas";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";

import {login, registerUser, requestVerificationCode, verifyVerifcationCode} from "src/server/users-server";
import {z} from "zod";

import * as style from "./Register.module.css"
import {useMutation} from "@tanstack/react-query";
import type {Credentials, RegisterData} from "src/domain/types";
import toast from "react-hot-toast";
import {CredentialError, CustomError} from "src/utilities/Utilities";
import {useNavigate} from "react-router-dom";
import {useLoading} from "src/components/LoadingOverlayProvider";
import {ButtonWithIcon, ContinueWithGoogleButton, ToggleButtonWithIcon} from "src/components/Buttons/Buttons";




interface EmailInputProps {
    register:UseFormRegister<RegisterData>
    errors:FieldErrors<RegisterData>
    email:string|undefined
    nextPage:()=>void
    processing:boolean
    setProcessing:(value:boolean)=>void
}
// Afiseaza sectiunea de introducere a emailului
function EmailInput({processing, setProcessing, register, errors, email, nextPage}:EmailInputProps) {

    const {showLoading, hideLoading} = useLoading()

    const {mutate} = useMutation({
        mutationFn: requestVerificationCode,
        onSuccess: () => {
            setProcessing(false)
            hideLoading()
            nextPage()
        },
        onError: (error) => {
            setProcessing(false)
            hideLoading()
            toast.error(error.message)
        }
    })

    return (
        <div className={style.emailInputFrame}>

            <ContinueWithGoogleButton/>

            <div className={style.orFrame}>
                <hr/>
                <p>or</p>
                <hr/>
            </div>

            <input
                data-tooltip-id={"email"}
                placeholder={"Input email"}
                {...register("email")}/>

            <FormInputErrorPopup name={"email"} errors={errors} place={"top"}/>

            {/* Butonul este dezactivat daca email-ul e invalid sau nu a fost introdus inca */}
            <button
                type={'button'}
                disabled={
                    (!!errors.email) ||
                    (email ? (email.length < 1) : true) ||
                    (processing)
                }
                onClick={async () => {
                    if (email) {
                        setProcessing(true)
                        showLoading();
                        mutate({email});
                    } else toast.error("Please input an email")
                }}
            > Next
            </button>
        </div>
    )
}

interface VerificationCodeInputProps {
    nextPage:()=>void
    email:string
    processing:boolean
    setProcessing:(value:boolean)=>void
}
// Afiseaza sectiunea de introducere a codului de verificare
function VerificationCodeInput({processing, setProcessing, nextPage, email}: VerificationCodeInputProps) {

    const {showLoading, hideLoading} = useLoading()

    const [code, setCode] = React.useState<string>("")

    const {mutate} = useMutation({
        mutationFn:verifyVerifcationCode,
        onSuccess:()=>{

            setProcessing(false)
            hideLoading()
            nextPage()
        },
        onError:(error)=>{
            setProcessing(false)
            hideLoading()
            toast.error(error.message)
        }
    })

    return(
        <div className={style.emailInputFrame}>
            <p>
                We have sent a verification code to your e-mail at:
            </p>
            <h3>
                 {email}
            </h3>
            <input onChange={(evt)=>setCode(evt.target.value)} placeholder={"Input verification code"} />
            <button
                type={'button'}
                onClick={()=>{
                    if (code || code.length>0) {
                        setProcessing(true)
                        showLoading()
                        mutate({email: email, code: code})
                    }
                    else toast.error("Please input the verification code.")
                }}
                disabled={(code.length<6) || processing}
            > Next </button>
        </div>
    )
}


interface CredentialInputProps {
    register:UseFormRegister<RegisterData>
    errors:FieldErrors<RegisterData>
    nextPage:()=>void
    processing:boolean
    setProcessing:(value:boolean)=>void
}
// Afiseaza sectiunea de introducere a credentialelor
function CredentialInput({processing, setProcessing, register, errors, nextPage}:CredentialInputProps) {

    const [hidePassword, setHidePassword] = React.useState(true);

    const togglePasswordVisibility = async ()=> setHidePassword(!hidePassword)

    return (
        <>
            <input
                data-tooltip-id={"username"}
                {...register("username")}
                placeholder={"Username"} />
            <FormInputErrorPopup name={"username"} errors={errors} place={"top"} />

            <div className={style.passwordInputFrame}>
                <input
                    data-tooltip-id={"password"}
                    {...register("password")}
                    placeholder={"Password"} />
                <FormInputErrorPopup name={"password"} errors={errors} place={"top"} />

                <ToggleButtonWithIcon isOn={!hidePassword}
                                          toggleIsOn={()=>setHidePassword}
                                          offImg={"images/hide.png"}
                                          onImg={"images/view.png"}

                                          type={'button'}
                                          onClick={togglePasswordVisibility}>
                    </ToggleButtonWithIcon>

            </div>

            <button disabled={(!!errors.password) || (!!errors.username) || processing}>
                Register
            </button>

        </>
    )
}



interface RenderSwitchProps {
    pageNum:number
    components:Array<ReactNode>
}
// Componenta de utilitate ce ia locul unui switch statement pentru randarea a mai multor componente.
function RenderSwitch({pageNum, components}:RenderSwitchProps) {
    return (
        components[pageNum]
    )
}

export function RegisterForm() {

    const navigate = useNavigate()
    const [page, setPage] = React.useState<number>(0)
    const nextPage = () => setPage(page + 1)
    const prevPage = () => setPage(page - 1)

    const [processing, setProcessing] = useState(false);

    const wrappedRegister = async(data:RegisterData)=>{

        await toast.promise(async()=>registerUser(data), {
                loading:'Registering . . .',
                error:(error:CustomError)=> {
                    return 'Could not register: ' + error.message
                },
                success: 'Registered successfully!',
            }
            )
    }

    const {mutate} = useMutation(
        {
            mutationFn: wrappedRegister,
            onSuccess: () => {
                navigate("/login")
            },
            onError: (error) => {
                if (error instanceof CredentialError) {
                    if (error.detail.identifier !== '')
                        setError("username", {
                            type: "manual",
                            message: error.detail.identifier
                        })
                    if (error.detail.password !== '')
                        setError("password", {
                            type: "manual",
                            message: error.detail.password
                        })
                }
            }
        }
    )


    const {register,
        setError,
        watch,
        handleSubmit,
        formState:{errors}} = useForm<RegisterData>(
            {
                resolver:zodResolver(registerData)
            }
        )
    const email = watch("email")

    const onSubmit:SubmitHandler<RegisterData> =
        (data:RegisterData) => {
            mutate(data);
        }

    const components:Array<ReactNode> = [
        <EmailInput register={register}
                    email={email}
                    nextPage={nextPage}
                    errors={errors}
                    processing={processing}
                    setProcessing={setProcessing} />,

        <VerificationCodeInput nextPage={nextPage} email={email}
                    processing={processing}
                    setProcessing={setProcessing}/>,

        <CredentialInput nextPage={nextPage}
                         register={register}
                         errors={errors}
                    processing={processing}
                    setProcessing={setProcessing} />
    ]


    return (
        <div className={style.frame}>
            <form
                onSubmit={handleSubmit(onSubmit)} >
                <div style={{display:"grid", position:'relative', marginBottom:'20px'}}>
                    <ButtonWithIcon
                        style={{position:'absolute', top:'0', left:'0', borderRadius:'3rem', border:'2px solid'}}
                        hidden={page === 0}
                        disabled={processing}
                        icon={'/images/left-arrow.png'}
                        onClick={prevPage}
                    />
                    <h2>
                        Register
                    </h2>
                </div>
                <RenderSwitch
                    pageNum={page}
                    components={components}
                />
            </form>
        </div>

    )
}