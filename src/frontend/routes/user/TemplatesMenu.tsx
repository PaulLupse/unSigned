import React from "react";
import {BackButton, NavButton} from "src/frontend/components/Buttons/Buttons";

export default function TemplatesMenu() {
    return (
        <div style={{display:'grid', placeItems:'center', width:'100%', height:'100%', boxSizing:'border-box'}}>
            <div style={{display:'flex', width:'100%', maxWidth:'200px', flexDirection:'column', gap:'5px', padding:'10px', border:'1px solid'}}>

                <h3>
                    Templates:
                </h3>

                <NavButton to={'/templates/mine'}>
                    My templates
                </NavButton>
                <NavButton to={'/templates/official'}>
                    Official templates
                </NavButton>
                <NavButton to={'/templates/public'}>
                    Public templates
                </NavButton>
                <BackButton>
                    Back
                </BackButton>
            </div>
        </div>
    )
}