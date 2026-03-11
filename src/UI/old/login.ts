import { SimpleTypeError } from "./utilities";

const url="http://127.0.0.1:8000";

export class LoginInfo {
    private _username;
    private _password;

    constructor(username:string, password:string) {
        this._username = username;
        this._password = password;

        Object.seal(this);
        Object.preventExtensions(this);
    }

    public get username() { return this._username; }
    public get password() { return this._password; }
}

async function getLoginInfo(usernameInputId:string, passwordInputId:string):Promise<LoginInfo> {
    
    try {
        const usernameInput:any = document.getElementById(usernameInputId);
        const passwordInput:any = document.getElementById(passwordInputId);
        
        if(usernameInput===null || passwordInput === null)
            throw new Error("Input elements not found.");

        if(usernameInput.nodeName !== "INPUT")
            throw new SimpleTypeError(usernameInput, "username", "<input>");
        if(passwordInput.nodeName !== "INPUT")
            throw new SimpleTypeError(passwordInput, "username", "<input>");

        const username = usernameInput.value;
        const password = passwordInput.value;

        return new LoginInfo(username, password);
    }

    catch(error:any) {
        console.error(error.toString());
        throw error;
    }
}

// functie ce trimite credentialele la server
// daca credentialele sunt corecte, raspunsul are atasat un htmlonly cookie cu valoarea jetonului de autentificare
// jetonul este salvat automat in browser
async function getAccessToken(loginInfo:LoginInfo) {

    const loginForm = new FormData();
    loginForm.append("username", loginInfo.username)
    loginForm.append("password", loginInfo.password)

    return await fetch(url+"/users/token", {method:"POST", body:loginForm});
}

// functie pt login in urma introducerii credentialelor
async function login(usernameInputId:string, passwordInputId:string){

    // initial citim datele introduse in formular
    const loginInfo:LoginInfo = await getLoginInfo(usernameInputId, passwordInputId);
    
    if(loginInfo === null)
        return undefined;

    try {

        const tokenResponse:Response = await getAccessToken(new LoginInfo(loginInfo.username, loginInfo.password));

        if(tokenResponse.ok) {

            console.log(`Logged in as ${loginInfo.username}.`);
            alert(`Logged in succesfuly as ${loginInfo.username}. Returning to main page.`);
            window.location.replace(url);
        }
        else {
            const errorMsg = "Server responded with status: " + tokenResponse.status + ".\nReturned message: " + (await tokenResponse.json()).message;
            throw new Error(errorMsg);
        }
    }
    catch(error) {
        alert(error);
    }
}

window.onload = async function() {
    const login_button:any = document.getElementById("login_button");
    login_button.addEventListener("click", function() { login("username", "password"); });
}