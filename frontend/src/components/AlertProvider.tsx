import React, {createContext, useContext, useState} from 'react';
import {Dialog, type DialogButtonProps} from "./Dialog/Dialog";

const AlertContext = createContext({showAlert:(message: string, buttons: DialogButtonProps[]):void=>{}});

interface AlertProviderProps {
    children:any
}

export const AlertProvider = ({children}:AlertProviderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState("");
    const [buttons, setButtons] = useState<DialogButtonProps[]>(new Array<DialogButtonProps>);

    const showAlert = (message:string, buttons:DialogButtonProps[]) => {
        setIsOpen(true);
        setText(message);
        setButtons(buttons);
    };

    const closeAlert = () => {
        setIsOpen(false);
    };

    return (
        <AlertContext value={{showAlert}}>
            {children}
            <Dialog text={text} open={isOpen} buttons={buttons} setClose={closeAlert} />
        </AlertContext>
    );
};

export const useAlert = () => useContext(AlertContext);
