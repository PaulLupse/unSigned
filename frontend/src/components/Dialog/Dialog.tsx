import React, {type RefObject, useEffect, useRef} from 'react';
import './dialog.css'
import ReactDOM, {createPortal} from "react-dom";

interface DialogWithButtonProps {
    buttonText:string
    buttonStyle:any
    buttonOnClick:()=>void
    text:string
}

export function DialogWithButton(props:DialogWithButtonProps) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const openModal = () => {
        dialogRef.current?.showModal();
    };

    const closeModal = () => {
        dialogRef.current?.close();
    };

    return (

        <>
            <button type='button' style={props.buttonStyle} onClick={()=>{openModal();}}>
                {props.buttonText}
            </button>

            <dialog ref={dialogRef}>

                <p>{props.text}</p>

                <div className={'actions-div'}>
                    <button type='button' className={'plain-button'} style={{flexGrow:'1'}} onClick={()=>{closeModal();}}>
                        Cancel
                    </button>
                    <button type='button' className={'plain-button'} style={{flexGrow:'1'}} onClick={()=>{closeModal(); props.buttonOnClick()}}>
                        Confirm
                    </button>
                </div>

            </dialog>
        </>
    )
}

export interface DialogButtonProps {
    text:string
    action?:()=>void
}

export interface DialogProps {
    text:string
    open:boolean
    setClose:()=>void
    buttons:DialogButtonProps[]
}

export function Dialog(props:DialogProps) {

    const ref = useRef<HTMLDialogElement>(null);

    function showModal() {
        ref.current?.showModal()
    }

    function closeModal() {
        ref.current?.close()
        props.setClose();
    }

    useEffect(()=>{
        if(props.open) showModal()
    }, [props.open])

    return (
        <dialog ref={ref}>
            <p>
                {props.text}
            </p>
            <div className={'actions-div'}>
                {
                    props.buttons.map((buttonOptions:DialogButtonProps, index)=>{
                        return (
                            <button type='button' className={'plain-button'} style={{flexGrow:'1'}} onClick={()=>{closeModal(); if(buttonOptions.action)buttonOptions.action()}}>
                                {buttonOptions.text}
                            </button>
                        )
                    })
                }
            </div>
        </dialog>
    )
}