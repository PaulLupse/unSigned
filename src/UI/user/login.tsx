import React from 'react';
import { createRoot } from 'react-dom/client';
import {CredentialForm} from "../components/CredentialForm";

import {login} from "./back-end-connection";

function LoginPage() {

    return (
        <div style={{height:'100vh', display:"flex", flexDirection:'column', alignItems:'stretch', justifyContent:'center'}}>
            <div style={{justifyContent:'center', display:'flex'}}>
                <CredentialForm
                    type="Login"
                    callback={
                        login
                    }
                />
            </div>
        </div>
    );
}

window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement;
    const root = createRoot(rootDiv);
    root.render(
        <LoginPage />
    );
}

