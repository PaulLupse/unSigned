import React, {useCallback, useRef} from 'react';
import {type SubmitHandler, useForm} from "react-hook-form";
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {zodResolver} from "@hookform/resolvers/zod";
import type {Credentials} from "src/domain/types";
import {credentialsSchema} from "src/domain/schemas";
import FormInputErrorPopup from "src/components/FormInputErrorPopup/FormInputErrorPopup";
import {CredentialError, CustomError} from "src/utilities/Utilities";

import * as style from "./credential-form.module.css"
import {ContinueWithGoogleButton, ToggleButtonWithIcon} from "src/components/Buttons/Buttons";
import toast from "react-hot-toast";
import {login} from "src/server/auth";
import {GoogleLogin, useGoogleLogin} from "@react-oauth/google";

// Componenta ce expune un formular de autentificare.
export function LoginForm() {

    const navigate = useNavigate()
    const queryClient = useQueryClient();
    const [hidePassword, setHidePassword] = React.useState(true);

    // Folosim un formular
    const {register,
        handleSubmit,
        formState:{errors},
        setError} = useForm<Credentials>(
            {resolver:zodResolver(credentialsSchema)}
        )

    const submitButton = useRef<HTMLButtonElement>(null);
    const toggleSubmitButton = useCallback(()=> {
            if (submitButton.current)
                submitButton.current.disabled = !submitButton?.current.disabled
        }, [submitButton]
    )

    const wrappedLogin = async(data:Credentials)=>{

        await toast.promise(async()=>login(data), {
                loading:'Logging in . . .',
                error:(error:CustomError)=> {
                    if (error.status == 409) {
                        navigate('/me', {replace:true})
                        return "Already logged in!"
                    }
                    return 'Could not log in: ' + error.message
                },
                success:'Logged in successfully!'
            }
            )}

    // Folosim react query pentru a trimite cererea de autentificare
    const {mutate} = useMutation({
        mutationFn:wrappedLogin,
        onSuccess: async ()=>{

            // Daca operatia de autentificare a fost realizata cu succes, actualizam datele legate de utilizator
            await queryClient.invalidateQueries({queryKey:['currentUser'], refetchType:'all'})
            // await queryClient.refetchQueries({queryKey:['user']})

            // Redirectionam spre pagina de profil
            navigate('/me', {replace:true})
        },
        onError: (error)=>{

            // In caz de eroare, setam mesajele aferente erorilor
            toggleSubmitButton()
            if(error instanceof CredentialError) {
                if(error.detail.identifier !== '')
                    setError("identifier", {
                        type:"manual",
                        message:error.detail.identifier
                    })
                if(error.detail.password !== '')
                    setError("password", {
                        type:"manual",
                        message:error.detail.password
                    })
            }
        }
    })

    // Ascunde sau afiseaza parola
    const togglePasswordVisibility = async ()=> setHidePassword(!hidePassword)

    const onSubmit:SubmitHandler<Credentials> = async (data:Credentials) => {
        toggleSubmitButton();
        mutate({identifier:data.identifier, password:data.password})
    }

    return (
        <div data-tooltip-id={"root"} className={style.frame}>
            <form onSubmit={handleSubmit(onSubmit)}>

                <h2>
                    Login
                </h2>

                <ContinueWithGoogleButton />

                <div className={style.orFrame}>
                    <hr /> <p>or</p> <hr />
                </div>


                {/* Input pentru identificator */}
                <input data-tooltip-id={'identifier'}
                       {...register('identifier')}
                       placeholder='Input username or email'/>


                <FormInputErrorPopup name={"identifier"} errors={errors} place={"left"} />

                <div className={style.passwordInputFrame} >

                    {/* Input pentru parola */}
                    <input data-tooltip-id={"password"}
                           {...register('password')}
                           placeholder='Input password'
                           type={hidePassword?"password":"text"}/>

                    <FormInputErrorPopup name={"password"} errors={errors} place={"left"} />

                    <ToggleButtonWithIcon isOn={!hidePassword}
                                          toggleIsOn={()=>setHidePassword}
                                          offImg={"images/hide.png"}
                                          onImg={"images/view.png"}

                                          type={'button'}
                                          onClick={togglePasswordVisibility}>
                    </ToggleButtonWithIcon>

                </div>

                <button ref={submitButton}
                        type={'submit'}>
                    Submit
                </button>

            </form>
            <FormInputErrorPopup name={'root'} errors={errors} place={'top'} />
        </div>
    );
}