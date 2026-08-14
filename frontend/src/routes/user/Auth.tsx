import React from 'react';
import { createRoot } from 'react-dom/client';
import {CredentialForm} from "../../components/CredentialForm/CredentialForm";

import {login, register} from "../../server/users-server";
import {Link, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import type {CustomError} from "src/utilities/Utilities";

export function LoginComponent() {

    const nav = useNavigate()

    const wrappedLogin = async(data:any)=>{
            await toast.promise(async()=>login(data), {
                    loading:'Logging in . . .',
                    error:(error:CustomError)=> {
                        if (error.status == 409) {
                            nav('/me', {replace:true})
                            return "Already logged in!"
                        }
                        return 'Could not log in: ' + error.message
                    },
                    success:'Logged in successfully!'
                }
                )}

    return (
        <div id='login div' style={{height:'100%', display:"flex", alignItems:'center', justifyContent:'center'}}>
            <div style={{justifyContent:'center', alignItems:'stretch', display:'flex', flexDirection:'column', flexGrow:'0.1'}}>
                <CredentialForm
                    type="Login"
                    callback={
                        wrappedLogin
                    }
                />
                <div style={{display:'flex', gap:'5px', alignItems:'center', justifyContent:'center'}}>
                    <p>
                        Don't have an account?
                    </p>
                    <Link to={'/register'} style={{color:'green'}}>
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function RegisterComponent() {

    const wrappedRegister = async(data:any)=>{
            await toast.promise(async()=>register(data), {
                    loading:'Registering . . .',
                    error:(error:Error)=>'Could not register: ' + error.message,
                    success:'Registered successfully! Redirecting to login page . . .'
                }
                )}

    return (
        <div id='register div' style={{height:'100%', display:"flex", alignItems:'center', justifyContent:'center'}}>
            <div style={{justifyContent:'center', alignItems:'stretch', display:'flex', flexDirection:'column', flexGrow:'0.1'}}>
                <CredentialForm
                    type="Register"
                    callback={
                        wrappedRegister
                    }
                />
                <div style={{display:'flex', gap:'5px', alignItems:'center', justifyContent:'center'}}>
                    <p>
                        Already have an account?
                    </p>
                    <Link to={'/login'} style={{color:'green'}}>
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

