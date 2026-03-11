import React from 'react';

interface CredentialFormProps {
    type:string
    callback:(username:string, password:string)=>void
}

export function CredentialForm(props: CredentialFormProps) {

    const usernameInputRef = React.useRef<HTMLInputElement>(null);
    const passwordInputRef = React.useRef<HTMLInputElement>(null);

    const [passwordInputType, setPasswordInputType] = React.useState('password');

    async function togglePasswordInputType() {
        if(passwordInputType === 'password') {
            setPasswordInputType('text');
            return
        }
        setPasswordInputType('password');
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyItems: 'center',
            marginTop: '10px',
            marginBottom: '10px',
            flexGrow: '1',
            maxWidth: '300px'
        }}>
            <div style={{marginRight: 'auto', marginLeft: 'auto'}}>
                <h2>{props.type}</h2>
            </div>
            <input ref={usernameInputRef} style={{marginBottom: '5px'}} placeholder='Username'/>
            <div style={{marginBottom: '5px', display:'flex'}}>
                <input ref={passwordInputRef}  placeholder='Password' type={passwordInputType}
                    style={{flexGrow:'1'}}/>
                <button onClick={togglePasswordInputType}
                    style={{marginLeft:'5px'}}>
                    {passwordInputType==='password'?'Show':'Hide'}
                </button>
            </div>
            <div style={{marginRight: 'auto', marginLeft: 'auto'}}>
                <button
                    onClick={
                        () => {
                            const usernameInput: HTMLInputElement | null = usernameInputRef.current
                            const passwordInput: HTMLInputElement | null = passwordInputRef.current

                            if (usernameInput && passwordInput && props.callback) {
                                props.callback(usernameInput.value, passwordInput.value);

                            }
                        }
                    }

                >{props.type}
                </button>
            </div>
        </div>
    );
}