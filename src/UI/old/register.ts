import { LoginInfo } from "./login";
import { SimpleTypeError } from "./utilities";

const url="http://127.0.0.1:8000";

class RegisterInput {
    #_username;
    #_password;
    #_email;

    constructor(username:string, password:string, email:string) {
        this.#_username = username;
        this.#_password = password;
        this.#_email = email;

        Object.seal(this);
        Object.preventExtensions(this);
    }

    get username() { return this.#_username; }
    get password() { return this.#_password; }
    get email() { return this.#_email; }
}

async function getRegisterData(usernameInputId:string, passwordInputId:string, emailInputId:string):Promise<RegisterInput> {
    
    if (typeof(usernameInputId) !== "string")
        throw new SimpleTypeError(usernameInputId, "usernameInputId", "string");
    if (typeof(passwordInputId) !== "string")
        throw new SimpleTypeError(usernameInputId, "usernameInputId", "string");
    if (typeof(emailInputId) !== "string")
        throw new SimpleTypeError(usernameInputId, "usernameInputId", "string");

    return new Promise( function (resolve, reject) {
        try 
        {
            const usernameInput:any = document.getElementById(usernameInputId);
            const passwordInput:any = document.getElementById(passwordInputId);
            const emailInput:any = document.getElementById(emailInputId);

            if (usernameInput.nodeName !== "INPUT")
                throw new SimpleTypeError(usernameInput, "usernameInput", "<input>");
            if (passwordInput.nodeName !== "INPUT")
                throw new SimpleTypeError(passwordInput, "passwordInput", "<input>");
            if (emailInput.nodeName !== "INPUT")
                throw new SimpleTypeError(emailInput, "emailInput", "<input>");

            const username = usernameInput.value;
            const password = passwordInput.value;
            const email = emailInput.value;

            resolve( new RegisterInput(username, password, email));
        }
        catch (error:any) {
            console.log(error.toString());
            reject(error);
        }
    });
}

async function register(usernameInputId:string, passwordInputId:string, emailInputId:string) {
    
    try {
        const registerInput = await getRegisterData(usernameInputId, passwordInputId, emailInputId);

        const requestHeader = new Headers({
            'Accept':"application/json",
            'Content-Type':"application/json"
        });

        const request = new Request(url + "/users/register", {
                method:"PUT",
                headers:requestHeader,
                body:JSON.stringify({
                    username:registerInput.username,
                    password:registerInput.password,
                    email:registerInput.email
                })
            });

        const response = await fetch(request);
        if (response.ok) {
            const data = await response.json();
            alert(data.message);
        }
        else {
            const data = await response.json();
            throw new Error("Server has responded with status: " + response.status
                + ".\nReturned message: " + data.message);
        }
    }
    catch (error:any) {
        alert(error.toString());
    }

}

window.onload = function() {
    const registerButton:any = document.getElementById("register_button");
    registerButton.addEventListener("click", function() {register("username_input", "password_input", "email_input")});
}