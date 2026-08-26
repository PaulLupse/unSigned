import React, {createContext, useContext, useState} from 'react';
import {Alert, type AlertButtonProps} from "./Alert/Alert";

const AlertContext = createContext({showAlert:(message: string, buttons: AlertButtonProps[]):void=>{}});

interface AlertProviderProps {
    children:any
}

export const AlertProvider = ({children}:AlertProviderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState("");
    const [buttons, setButtons] = useState<AlertButtonProps[]>(new Array<AlertButtonProps>);

    const showAlert = (message:string, buttons:AlertButtonProps[]) => {
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
            <Alert text={text} open={isOpen} buttons={buttons} setClose={closeAlert} />
        </AlertContext>
    );
};

export const useAlert = () => useContext(AlertContext);
