// acest script contine parte din logica de comunicare cu serverul web, precum logare, inregistrare si operati CRUD

import {CredentialError, CustomError} from "../../Utilities";

import {LoginInfo, type FormInfo, type NewForm, type MinimalFormInfo, type Email} from "../../domain/types";
import {formInfoSchema, minimalFormInfoSchema} from "../../domain/schemas";
import {use} from "react";

async function getAccessToken(loginInfo:LoginInfo) {

    const loginForm = new FormData();
    loginForm.append("username", loginInfo.username)
    loginForm.append("password", loginInfo.password)

    return await fetch("/api/users/token", {method:"POST", body:loginForm});
}

// functie pt login in urma introducerii credentialelor
export async function login({username, password}:{username:string, password:string}):Promise<void>{

    // initial citim datele introduse in formular
    const loginInfo:LoginInfo = new LoginInfo(username, password);

    const tokenResponse: Response = await getAccessToken(new LoginInfo(loginInfo.username, loginInfo.password));

    if (!tokenResponse.ok) {
        if (tokenResponse.status == 404) {
            throw new CredentialError("User not found.", {password:'', username:'User not found.'}, 404)
        } else if (tokenResponse.status == 400) {
            throw new CredentialError("Wrong password.", {username:'', password:'Wrong password.'}, 400)
        }
    }
}

export async function register({username, password}:{username: string, password: string}):Promise<void> {

    const requestHeader = new Headers({
        'Accept': "application/json",
        'Content-Type': "application/json"
    });

    const request = new Request("/api/users/register", {
        method: "PUT",
        headers: requestHeader,
        body: JSON.stringify({
            username: username,
            password: password,
            email: (username != undefined) ? password : undefined
        })
    });

    const response = await fetch(request);
    if (!response.ok)  {
        if(response.status == 409) {
            throw new CredentialError("User already exists.", {username:'User already exists.', password:''}, 409)
        }
    }

}

// functie pt login automat, daca utilizatorul s-a logat anterior
export async function auto_login():Promise<string>{

    const loginRequest = new Request(
        "/api/users/me",
        {
            method:"POST",
            credentials:'include'
        });


    const loginResponse = await fetch(loginRequest);

    if(loginResponse.ok)
    {
        const data:any = await loginResponse.json();
        if(Object.hasOwn(data, 'username'))
            return data.username;
        else
            throw new CustomError("Autologin did not return a username.", 500);

    }
    else {
        console.log("Could not login automatically.");
        throw new CustomError("Could not login automatically.", 401)
    }

}

export async function logout():Promise<boolean> {

    const logoutRequest = new Request("/api/users/me/logout",
        {
            method:"POST",
            credentials:"include"
        });

    const logoutResponse = await fetch(logoutRequest);
    if(logoutResponse.ok)
        return true
    else throw new CustomError("Could not log out.", 500)

}

export async function get_form(formId:string):Promise<FormInfo|undefined> {

    const getItemsRequest = new Request(
        `/api/users/me/form/${formId}`,
        {
            method:'GET',
            credentials:'include'
        });

    const requestResponse = await fetch(getItemsRequest);
    if (requestResponse.ok) {

        const data = await requestResponse.json();
        if(Object.hasOwn(data, 'form'))
        {
            const dataParseResult = formInfoSchema.safeParse(data.form);
            if(dataParseResult.success) {
                return dataParseResult.data
            } else console.log("Wrong json coming from server:" + dataParseResult.error)
        }

    } else if (requestResponse.status == 404) {
        throw new CustomError("Form not found.", 404)
    }

}

export async function get_forms():Promise<Array<MinimalFormInfo>|undefined> {
    try {

        const getItemsRequest = new Request(
            '/api/users/me/forms',
            {
                method:'GET',
                credentials:'include'
            });

        const requestResponse = await fetch(getItemsRequest);
        if (requestResponse.ok) {

            const data = await requestResponse.json();
            if(Object.hasOwn(data, 'forms'))
            {
                const parseResult = minimalFormInfoSchema.array().safeParse(data.forms);
                if(parseResult.success) {
                    return parseResult.data;
                } else {
                    console.log("Wrong json coming from server:" + parseResult.error);
                    return undefined;
                }
            }
            else
                throw new Error('Get items request did not return items.')
        }
    }
    catch (error) {
        return undefined;
    }
}

export async function add_form(form:NewForm):Promise<string|undefined> {

    const requestHeader = new Headers({
        'Accept': "application/json",
        'Content-Type': "application/json"
    });

    console.log(form)

    const createItemRequest = new Request("/api/users/me/form/add",
        {
            method:"POST",
            headers:requestHeader,
            body:JSON.stringify(form)
        }
    )
    const createItemResponse = await fetch(createItemRequest);
    if(createItemResponse.ok) {
        return (await createItemResponse.json()).formId;
    }
    const errorMsg:string = (await createItemResponse.json()).message;

    if(createItemResponse.status == 409)
        throw new CustomError("Form with this name already exists.", 409)
    if(createItemResponse.status == 400)
        throw new CustomError("Invalid form structure.", 400)
}

export async function delete_form(formId:string):Promise<boolean|undefined> {

    const deleteRequest:Request = new Request(`/api/users/me/form/${formId}/delete`,
        {
            method:'DELETE'
        }
    );

    const deleteResponse = await fetch(deleteRequest);

    if(deleteResponse.ok) {
        return true;
    }
    else {
        const deleteResponseData = await deleteResponse.json();
        if(deleteResponse.status == 404)
            throw new CustomError("Form does not exist.", 404)
    }

}

export async function distribute_keys({emails, formId}:{emails: Email[], formId: string}):Promise<boolean> {

    const requestHeader = new Headers({
            'Accept': "application/json",
            'Content-Type': "application/json"
        });

    const dist_keys_request = new Request(`/api/users/me/form/${formId}/distribute_keys`,
        {
            method:'POST',
            headers: requestHeader,
            body:JSON.stringify({emails:emails})
        })

    const dist_keys_response = await fetch(dist_keys_request);

    if(dist_keys_response.ok)
        return true
    else {
        throw new Error("Unexpected error while distributing keys.")
    }
}