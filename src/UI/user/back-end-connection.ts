// acest script contine parte din logica de comunicare cu serverul web, precum logare, inregistrare si operati CRUD

import config from '../config.json'

const url:string = config.baseURL;

import {LoginInfo, type FormInfo, type NewForm, type MinimalFormInfo} from "../domain/types";
import {formInfoSchema, minimalFormInfoSchema} from "../domain/schemas";
import {use} from "react";

export interface CredentialResult {
    ok:true|false
    errorMsg?:{username?:string, password?:string}|string
}

export async function getAccessToken(loginInfo:LoginInfo) {

    const loginForm = new FormData();
    loginForm.append("username", loginInfo.username)
    loginForm.append("password", loginInfo.password)

    return await fetch(url+"/users/token", {method:"POST", body:loginForm});
}

// functie pt login in urma introducerii credentialelor
export async function login(username:string, password:string):Promise<CredentialResult>{

    // initial citim datele introduse in formular
    const loginInfo:LoginInfo = new LoginInfo(username, password);

    try {

        const tokenResponse:Response = await getAccessToken(new LoginInfo(loginInfo.username, loginInfo.password));

        if(tokenResponse.ok) {
            return {ok:true};
        }
        else {
            if(tokenResponse.status == 404) {
                return {ok:false, errorMsg:"User not found."}
            } else if (tokenResponse.status == 400) {
                return {ok:false, errorMsg:{password:"Wrong password."}}
            }  throw new Error("Unexpected error");
        }
    }
    catch(error:any) {
        alert(error);
        return {ok:false, errorMsg:error.toString()};
    }
}

export async function register(username:string, password:string):Promise<CredentialResult> {

    try {

        const requestHeader = new Headers({
            'Accept': "application/json",
            'Content-Type': "application/json"
        });

        const request = new Request(url + "/users/register", {
            method: "PUT",
            headers: requestHeader,
            body: JSON.stringify({
                username: username,
                password: password,
                email: (username != undefined) ? password : undefined
            })
        });

        const response = await fetch(request);
        if (response.ok) {
            return {ok:true};
        } else {
            if(response.status == 409) {
                return {ok:false, errorMsg:{username:"User already exists."}}
            } else throw new Error("Unexpected error");
        }
    } catch (error: any) {
        alert(error.toString());
        return {ok:false, errorMsg:error.toString()};
    }
}

// functie pt login automat, daca utilizatorul s-a logat anterior
export async function auto_login():Promise<string>{

    const loginRequest = new Request(
        url + "/users/me",
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
            throw new Error("Autologin did not return a username.");

    }
    else {
        console.log("Could not login automatically.");
        throw new Error("Could not login automatically.")
    }

}

export async function logout():Promise<boolean> {
    try {
        const logoutRequest = new Request(url+"/users/me/logout",
            {
                method:"POST",
                credentials:"include"
            });

        const logoutResponse = await fetch(logoutRequest);
        return logoutResponse.ok;

    }
    catch(error) {
        alert(error);
        return false;
    }
}

export async function get_form(formId:string):Promise<FormInfo> {
    // try {
        const getItemsRequest = new Request(
            url+`/users/me/form/${formId}`,
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
            throw new Error("Form not found.")
        }
    // }
    throw new Error("Internal server error.")
}

export async function get_forms():Promise<Array<MinimalFormInfo>|undefined> {
    try {

        const getItemsRequest = new Request(
            url+'/users/me/forms',
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
        alert(error);
        return undefined;
    }
}

export async function add_form(form:NewForm):Promise<string> {
    try {

        const requestHeader = new Headers({
            'Accept': "application/json",
            'Content-Type': "application/json"
        });


        const createItemRequest = new Request(url+"/users/me/form/add",
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
        throw new Error(`Failed to create item. Returned message: ${errorMsg}`)
    }
    catch(Error) {
        return "";
    }

}

export async function delete_form(formId:string):Promise<boolean> {
    try {
        const deleteRequest:Request = new Request(url+`/users/me/form/${formId}/delete`,
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
            throw new Error("Could not delete form. Returned message: " + deleteResponseData.message)
        }
    }
    catch(error) {
        alert(error);
        return false;
    }
}