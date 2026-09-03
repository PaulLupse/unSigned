import {CredentialError, CustomError, handleGenericErrorResponses} from "src/utilities/Utilities";

import {
    LoginInfo,type User,
    type RegisterData
} from "src/domain/types";
import {
    emailSchema,
    userSchema
} from "src/domain/schemas";
import {fetch} from "src/utilities/Utilities";
import {z} from "zod";
import {REQUEST_WITH_PAYLOAD_HEADERS} from "src/common";

// Cere un jeton de access (jwt).
// Returneaza un obiect response cu detaliile de autorizare.
async function getAccessToken(loginInfo:LoginInfo) {

    const loginForm = new FormData();
    loginForm.append("username", loginInfo.username)
    loginForm.append("password", loginInfo.password)

    return await fetch("/api/auth/token", {method:"POST", body:loginForm});
}

// Incearca autorizarea utilizatorului folosind nume si parola.
// Arunca erori daca autorizarea a esuat, cu motivele esuarii.
export async function login({identifier, password}:{identifier:string, password:string}):Promise<void>{


    const tokenResponse: Response = await getAccessToken(new LoginInfo(identifier, password));

    if (tokenResponse.ok) return

    switch(tokenResponse.status) {
        case 404:
            throw new CredentialError("User not found", {password:'', identifier:'User not found'}, 404)
        case 400:
            throw new CredentialError("Wrong password", {identifier:'', password:'Wrong password'}, 400)
        case 409:
            throw new CustomError("Already logged in!", 409)
    }

    handleGenericErrorResponses(tokenResponse)
}

// Inregistreaza utilizatorul.
// Arunca erori daca inregistrarea a esuat, cu motivele esuarii.
export async function registerUser({username, password, email}:RegisterData):Promise<void> {

    const request = new Request("/api/auth/register", {
        method: "PUT",
        headers: REQUEST_WITH_PAYLOAD_HEADERS,
        body: JSON.stringify({
            username: username,
            password: password,
            email: email
        })
    });

    const response = await fetch(request);
    if (!response.ok)  {
        if(response.status == 409) {
            throw new CredentialError("User already exists", {identifier:'User already exists', password:''}, 409)
        }
        else if (response.status == 429) {
            throw new CustomError("Slow down! (you are being rate limited)", 429)
        }
    }

    handleGenericErrorResponses(response)
}

// Folosita la butonul de logare/inregistrare cu google
export async function handleGoogleUser({googleCode}:{googleCode:string}) {

    const request = new Request("/api/auth/google", {
        method:"POST",
        headers:REQUEST_WITH_PAYLOAD_HEADERS,
        body:JSON.stringify({googleCode: googleCode})
    })

    const response = await window.fetch(request)

    if (!response.ok) throw new Error("Failed to log in with Google.")
}

// Trimite o cerere de verificare a email-ului specificat.
export async function requestVerificationCode({email}:z.infer<typeof emailSchema>) {

    const request = new Request("api/auth/verification-code/request",{
        method:"PUT",
        body:JSON.stringify({email:email}),
        headers:REQUEST_WITH_PAYLOAD_HEADERS
    })

    const response = await fetch(request)


    if (response.status === 409)
        throw new CustomError("Email already in use.", 409)

    handleGenericErrorResponses(response)
}

// Trimite cerere de verificare a codului primit ca urmare a utilizarii functiei anterioare.
export async function verifyVerifcationCode({email, code}:{email:string, code:string}) {

    const request = new Request("api/auth/verification-code/check",{
        method:"PUT",
        body:JSON.stringify({email:email, code:code}),
        headers:REQUEST_WITH_PAYLOAD_HEADERS
    })

    const response = await fetch(request)

    if (response.ok) return

    switch (response.status) {
        case 400:
            throw new CustomError("Invalid code", 400)
        case 404:
            throw new CustomError("Code not found", 404)
    }

    handleGenericErrorResponses(response)
}

// Verifica daca utilizatorul este logat.
// Returneaza detaliile utilizatorului, in caz afirmativ.
export async function getCurrentUserData():Promise<User|undefined>{

    const loginRequest = new Request(
        "/api/user/me",
        {
            method:"GET",
            credentials:'include'
        });

    const loginResponse = await fetch(loginRequest);


    if(loginResponse.ok)
    {
        const data:any = await loginResponse.json();

        const parseResult = userSchema.safeParse(data)
        if (parseResult.success) return parseResult.data
        else throw new Error("Bad user data coming from server")
    }

    handleGenericErrorResponses(loginResponse)
}

// Deautorizeaza utilizatorul.
export async function logoutUser():Promise<void> {

    const logoutRequest = new Request("/api/auth/me/logout",
        {
            method:"POST",
            credentials:"include"
        });

    const logoutResponse = await fetch(logoutRequest);
    if(logoutResponse.ok) return

    else throw new CustomError("Could not log out.", 500)
}

// Sterge utilizatorul curent
export async function deleteUser({userId}:{userId: string}) {

    const req = new Request(`/api/user/${userId}/delete`,  {
        method:"DELETE"
    })

    const response = await fetch(req)

    if (response.ok) return

    if (response.status === 404) throw new Error("User not found.")

    handleGenericErrorResponses(response)
}