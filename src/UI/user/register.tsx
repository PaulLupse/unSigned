import React from 'react'
import {createRoot} from "react-dom/client";
import {CredentialForm} from "../components/CredentialForm";
import {register} from "./back-end-connection";

function RegisterPage() {

    return (
        <div style={{height:'100vh', display:"flex", flexDirection:'column', alignItems:'stretch', justifyContent:'center'}}>
            <div style={{justifyContent:'center', display:'flex'}}>
                <CredentialForm
                    type="Register"
                    callback={
                        register
                    }
                />
            </div>
        </div>
    );
}

window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById('root') as HTMLDivElement;
    const root = createRoot(rootDiv);
    root.render(<RegisterPage />);
}