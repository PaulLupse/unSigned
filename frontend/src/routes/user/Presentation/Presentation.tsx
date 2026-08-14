import React from "react";
import * as style from './Presentation.module.css'

export function Presentation() {

    return (
        <div className={style.presentation}>
            <div className={style.card}>
                <h1>
                    unSigned
                </h1>
                <label>
                    Anonymous forms
                </label>
                <div>
                    <div>
                        <hr/>
                        Key based
                        <hr/>
                    </div>
                    <div>
                        <hr/>
                        Stateless
                        <hr/>
                    </div>
                    <div>
                        <hr/>
                        Performant
                        <hr/>
                    </div>
                </div>
            </div>
        </div>
    )
}