// acest script contine parte din logica de comunicare cu serverul web, precum logare, inregistrare si operati CRUD

import {CredentialError, CustomError} from "../Utilities";

import {
    LoginInfo,
    type FormInfo,
    type NewForm,
    type MinimalFormInfo,
    type Email,
    type MinimalTemplate, type Template, type TextQuestionAnswerStatistic, type GridQuestionAnswerStatistic, type User
} from "../domain/types";
import {
    formInfoSchema,
    minimalFormInfoSchema,
    minimalTemplateSchema,
    templateSchema,
    userSchema
} from "../domain/schemas";
const requestWithPayloadHeaders = new Headers({
        'Accept': "application/json",
        'Content-Type': "application/json"
    });

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
            throw new CredentialError("User not found", {password:'', username:'User not found'}, 404)
        } else if (tokenResponse.status == 400) {
            throw new CredentialError("Wrong password", {username:'', password:'Wrong password'}, 400)
        } else if (tokenResponse.status == 409)
        throw new CustomError("Already logged in!", 409)
        else if (tokenResponse.status == 429) {
            throw new CustomError("Slow down! (you are being rate limited)", 429)
        }
    }
}

export async function register({username, password}:{username: string, password: string}):Promise<void> {

    const request = new Request("/api/users/register", {
        method: "PUT",
        headers: requestWithPayloadHeaders,
        body: JSON.stringify({
            username: username,
            password: password,
            email: (username != undefined) ? password : undefined
        })
    });

    const response = await fetch(request);
    if (!response.ok)  {
        if(response.status == 400) {
            throw new CredentialError("Password too short", {username:'', password:'Password too short'}, 400)
        }
        if(response.status == 409) {
            throw new CredentialError("User already exists", {username:'User already exists', password:''}, 409)
        }
        else if (response.status == 429) {
            throw new CustomError("Slow down! (you are being rate limited)", 429)
        }
    }

}

// functie pt login automat, daca utilizatorul s-a logat anterior
export async function auto_login():Promise<User|undefined>{

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

        const parseResult = userSchema.safeParse(data)
        if (parseResult.success) return parseResult.data
        else throw new Error("Bad user data coming from server")
    }
    else {
        if(loginResponse.status == 401)
            throw new CustomError("Please log in first", 401)
        if (loginResponse.status == 429) {
            throw new CustomError("Slow down! (you are being rate limited)", 429)
        }
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
        if (Object.hasOwn(data, 'form')) {
            const dataParseResult = formInfoSchema.safeParse(data.form);
            if (dataParseResult.success) {
                return dataParseResult.data
            } else console.log("Wrong json coming from server:" + dataParseResult.error)
        }
    }
    if (requestResponse.status == 404)
        throw new CustomError("Form not found.", 404)

    if(requestResponse.status == 400)
            throw new CustomError("Invalid form id.", 401)

    if (requestResponse.status == 429)
        throw new CustomError("Slow down! (you are being rate limited)", 429)

    if(requestResponse.status == 401)
        throw new CustomError("Please log in first.", 401)
}

export async function get_forms():Promise<Array<MinimalFormInfo>|undefined> {

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
                console.log(parseResult.data)
                return parseResult.data;
            } else {
                console.log("Wrong json coming from server:" + parseResult.error);
                throw new CustomError("Bad communication with server.", 500)
            }
        }
        else
            throw new CustomError('Bad communication with server. No data returned.', 500)
    } else {
        if(requestResponse.status == 401)
            throw new CustomError("Please log in first.", 401)

        if (requestResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)

    }

}

export async function add_form(form:NewForm):Promise<string|undefined> {

    console.log(form)

    const createItemRequest = new Request("/api/users/me/form/add",
        {
            method:"POST",
            headers:requestWithPayloadHeaders,
            body:JSON.stringify(form)
        }
    )
    const createItemResponse = await fetch(createItemRequest);
    if(createItemResponse.ok) {
        return (await createItemResponse.json()).formId;
    }

    if(createItemResponse.status == 409)
        throw new CustomError("Form with this name already exists.", 409)
    if(createItemResponse.status == 400)
        throw new CustomError("Invalid form structure.", 400)
    if(createItemResponse.status == 401)
        throw new CustomError("Please log in first.", 401)
    if (createItemResponse.status == 429)
        throw new CustomError("Slow down! (you are being rate limited)", 429)

}

export async function update_form({newFormData, formId}:{newFormData: NewForm, formId: string}) {

    console.log(newFormData)

    const updateFormRequest:Request = new Request(`/api/users/me/form/${formId}/edit`,
        {
            method:"PUT",
            headers:requestWithPayloadHeaders,
            body:JSON.stringify({
                name:newFormData.name,
                questions:newFormData.questions
            })
        });

    const updateFormResponse = await fetch(updateFormRequest);

    if(updateFormResponse.ok) return true;
    else {

        if(updateFormResponse.status == 404)
            return new CustomError("Form not found.", 404);
        else if(updateFormResponse.status == 400)
            return new CustomError("Bad request :(", 400);
        if(updateFormResponse.status == 401)
            throw new CustomError("Please log in first.", 401)
        if (updateFormResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
    }
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
        if(deleteResponse.status == 404)
            throw new CustomError("Form does not exist.", 404)
        if(deleteResponse.status == 401)
            throw new CustomError("Please log in first.", 401)
        if (deleteResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
    }

}

export async function get_form_submission_data(formId:string):
    Promise<Array<TextQuestionAnswerStatistic|GridQuestionAnswerStatistic>|undefined> {

    const getDataRequest = new Request(`/api/users/me/form/${formId}/submission-data`,
        {
            method:'GET'
        })

    const getDataResponse = await fetch(getDataRequest)

    if (getDataResponse.ok)
        return await getDataResponse.json()

    else {
        if (getDataResponse.status == 404)
            throw new Error("Form not found.")
        if(getDataResponse.status == 401)
            throw new CustomError("Please log in first.", 401)
        if (getDataResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
    }
}

export async function publish_form(formId:string):Promise<boolean|undefined> {

    const publishRequest = new Request(`/api/users/me/form/${formId}/publish`, {
            method:"POST"
        })

    const publishResponse = await fetch(publishRequest);

    if (publishResponse.ok) {
        return true;
    } else {
        if (publishResponse.status == 404)
            throw new CustomError("Form does not exist.", 404)
        else if(publishResponse.status == 409)
            throw new CustomError("Form already closed.", 409)
        if(publishResponse.status == 401)
            throw new CustomError("Please log in first.", 401)
        if (publishResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
    }
}

export async function close_form(formId:string):Promise<boolean|undefined> {

    const closeRequest = new Request(`/api/users/me/form/${formId}/close`, {
            method:"POST"
        })

    const closeResponse = await fetch(closeRequest);

    if (closeResponse.ok) {
        return true;
    } else {
        if (closeResponse.status == 404)
            throw new CustomError("Form does not exist.", 404)
        else if(closeResponse.status == 409)
            throw new CustomError("Form not published.", 409)
        if(closeResponse.status == 401)
            throw new CustomError("Please log in first.", 401)
        if (closeResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
    }
}

export async function create_template({templateData, type}:{templateData:NewForm, type:'official'|undefined}):Promise<string|undefined> {

    const route:string = type==undefined?"/api/templates/create":"/api/admin/official-templates/create"

    const createItemRequest = new Request(route,
        {
            method:"POST",
            headers:requestWithPayloadHeaders,
            body:JSON.stringify(templateData)
        }
    )
    const createItemResponse = await fetch(createItemRequest);
    if(createItemResponse.ok) {
        return (await createItemResponse.json()).formId;
    }

    if(createItemResponse.status == 409)
        throw new CustomError("Form with this name already exists.", 409)
    if(createItemResponse.status == 400)
        throw new CustomError("Invalid form structure.", 400)
    if(createItemResponse.status == 401)
        throw new CustomError("Please log in first.", 401)
    if (createItemResponse.status == 429)
        throw new CustomError("Slow down! (you are being rate limited)", 429)
}

export async function get_templates({type}:{type:'public'|'mine'|'official'}):Promise<Array<MinimalTemplate>|undefined> {

    const getTemplatesRequest = new Request(`/api/templates/${type}`, {
        method:"GET"
    })

    const getTemplatesResponse = await fetch(getTemplatesRequest)

    if(getTemplatesResponse.ok) {
        const parseResult = minimalTemplateSchema.array().safeParse(await getTemplatesResponse.json())
        if (parseResult.success) {
            return parseResult.data
        } else {
            throw new Error("Bad data coming from server . . .")
        }
    }

    if(getTemplatesResponse.status == 401)
        throw new CustomError("Please log in first.", 401)
    if (getTemplatesResponse.status == 429)
        throw new CustomError("Slow down! (you are being rate limited)", 429)
}

export async function get_template({templateId}:{templateId:string}):Promise<Template|undefined> {

    const getTemplateRequest = new Request(`/api/templates/${templateId}`, {
        method:"GET"
    })

    const getTemplateResponse = await fetch(getTemplateRequest)

    if(getTemplateResponse.ok) {

        const parseResult = templateSchema.safeParse(await getTemplateResponse.json())

        if (parseResult.success) {
            return parseResult.data
        } else {
            throw new Error("Bad data coming from server . . . ")
        }
    } else {
        if (getTemplateResponse.status == 404)
            throw new CustomError("Template not found", 404)
        if(getTemplateResponse.status == 401)
            throw new CustomError("Please log in first.", 401)
        if(getTemplateResponse.status == 400)
            throw new CustomError("Invalid template id.", 401)
        if(getTemplateResponse.status == 403)
            throw new CustomError("Unauthorized to view template", 403)
        if (getTemplateResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
    }
}

export async function update_template({templateId, newTemplateData}:{templateId:string, newTemplateData:NewForm}):Promise<boolean|undefined> {


    const route:string = `/api/admin/official-templates/${templateId}/edit`

    const editTemplateRequest = new Request(route, {
        method:"PUT",
        body:JSON.stringify(newTemplateData),
        headers:requestWithPayloadHeaders
    })

    const editTemplateResponse = await fetch(editTemplateRequest)

    if (editTemplateResponse.ok) return true;

    if (editTemplateResponse.status==404) throw new Error("Form not found")
    if (editTemplateResponse.status==400) throw new Error("Bad template data.")
    if(editTemplateResponse.status == 401) throw new CustomError("Please log in first.", 401)
    if(editTemplateResponse.status == 403) throw new CustomError("Unauthorized to edit template", 403)
    if (editTemplateResponse.status==429) throw new CustomError("Slow down! (you are being rate limited)", 429)
}

export async function delete_template({templateId}:{templateId:string}):Promise<boolean|undefined> {


    const route:string = `/api/templates/${templateId}/delete`

    const deleteTemplateRequest = new Request(route, {
        method:'DELETE'
    })

    const deleteTemplateResponse = await fetch(deleteTemplateRequest)

    if(deleteTemplateResponse.ok) return true;

    if (deleteTemplateResponse.status == 404) throw new CustomError("Form does not exist.", 404)
    if (deleteTemplateResponse.status == 401) throw new CustomError("Please log in first.", 401)
    if (deleteTemplateResponse.status == 403) throw new CustomError("Unauthorized to delete template", 403)
    if (deleteTemplateResponse.status == 429) throw new CustomError("Slow down! (you are being rate limited)", 429)

}

export async function distribute_keys({emails, formId}:{emails: Email[], formId: string}):Promise<boolean|undefined> {

    const distKeysRequest = new Request(`/api/users/me/form/${formId}/distribute_keys`,
        {
            method:'POST',
            headers: requestWithPayloadHeaders,
            body:JSON.stringify({emails:emails})
        })

    const distKeysResponse = await fetch(distKeysRequest);

    if(distKeysResponse.ok)
        return true
    else {

        if(distKeysResponse.status == 401) throw new CustomError("Please log in first.", 401)
        if (distKeysResponse.status == 429)
            throw new CustomError("Slow down! (you are being rate limited)", 429)
        throw new Error("Unexpected error while distributing keys.")
    }
}
