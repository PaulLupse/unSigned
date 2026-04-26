import React from 'react';
import { createRoot } from 'react-dom/client';
import {CredentialForm} from "../../components/CredentialForm/CredentialForm";

import {login, register} from "./back-end-connection";
import { Link } from "react-router-dom";

export function LoginComponent() {

    return (
        <div id='login div' style={{height:'100%', display:"flex", alignItems:'center', justifyContent:'center'}}>
            <div style={{justifyContent:'center', alignItems:'stretch', display:'flex', flexDirection:'column', flexGrow:'0.2'}}>
                <CredentialForm
                    type="Login"
                    callback={
                        login
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

    return (
        <div id='register div' style={{height:'100%', display:"flex", alignItems:'center', justifyContent:'center'}}>
            <div style={{justifyContent:'center', alignItems:'stretch', display:'flex', flexDirection:'column', flexGrow:'0.2'}}>
                <CredentialForm
                    type="Register"
                    callback={
                        register
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

