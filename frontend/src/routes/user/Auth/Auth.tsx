import React from 'react';
import {LoginForm} from "src/components/CredentialForm/CredentialForm";

import {registerUser} from "src/server/users-server";
import {Link} from "react-router-dom";
import toast from "react-hot-toast";

import * as style from "./auth.module.css"
import {RegisterForm} from "src/components/RegisterForm/RegisterForm";

export function LoginComponent() {

    return (

        <div className={style.main}>
            <div>
                <LoginForm />
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
        <div className={style.main}>
            <div>
                <RegisterForm />
                <div style={{display:'flex', justifyContent:"space-between"}}>
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

