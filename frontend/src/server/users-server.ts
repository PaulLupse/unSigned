// acest script contine parte din logica de comunicare cu serverul web, precum logare, inregistrare si operati CRUD

import {CredentialError, CustomError} from "src/utilities/Utilities";

import {
    LoginInfo,
    type FormInfo,
    type NewForm,
    type MinimalFormInfo,
    type Email,
    type MinimalTemplate, type Template, type TextQuestionAnswerStatistic, type GridQuestionAnswerStatistic, type User,
    type RegisterData
} from "src/domain/types";
import {
    emailSchema,
    formInfoSchema,
    minimalFormInfoSchema,
    minimalTemplateSchema,
    templateSchema,
    userSchema
} from "src/domain/schemas";
import {fetch} from "src/utilities/Utilities";
import {z} from "zod";
const requestWithPayloadHeaders = new Headers({
        'Accept': "application/json",
        'Content-Type': "application/json"
    });

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

    if (!tokenResponse.ok) {
        if (tokenResponse.status == 404) {
            throw new CredentialError("User not found", {password:'', identifier:'User not found'}, 404)
        } else if (tokenResponse.status == 400) {
            throw new CredentialError("Wrong password", {identifier:'', password:'Wrong password'}, 400)
        } else if (tokenResponse.status == 409)
        throw new CustomError("Already logged in!", 409)
        else if (tokenResponse.status == 429) {
            throw new CustomError("Slow down! (you are being rate limited)", 429)
        }
    }
}

// Inregistreaza utilizatorul.
// Arunca erori daca inregistrarea a esuat, cu motivele esuarii.
export async function registerUser({username, password, email}:RegisterData):Promise<void> {

    const request = new Request("/api/auth/register", {
        method: "PUT",
        headers: requestWithPayloadHeaders,
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

}

// Trimite o cerere de verificare a email-ului specificat.
export async function requestVerificationCode({email}:z.infer<typeof emailSchema>) {

    const request = new Request("api/auth/verification-code/request",{
        method:"PUT",
        body:JSON.stringify({email:email}),
        headers:requestWithPayloadHeaders
    })

    const response = await fetch(request)

    if (!response.ok) {
        if (response.status === 409)
            throw new CustomError("Email already in use.", 409)
        if (response.status === 500)
            throw new CustomError("Email could not be sent. Please try again", 500)
    }
}

// Trimite cerere de verificare a codului primit ca urmare a utilizarii functiei anterioare.
export async function verifyVerifcationCode({email, code}:{email:string, code:string}) {

    const request = new Request("api/auth/verification-code/check",{
        method:"PUT",
        body:JSON.stringify({email:email, code:code}),
        headers:requestWithPayloadHeaders
    })

    const response = await fetch(request)

    if (!response.ok) {
        switch (response.status) {
            case 400:
                throw new CustomError("Invalid code", 400)
            case 404:
                throw new CustomError("Code not found", 404)
        }
    }
}

// Verifica daca utilizatorul este logat.
// Returneaza detaliile utilizatorului, in caz afirmativ.
export async function getUserData():Promise<User|undefined>{

    const loginRequest = new Request(
        "/api/auth/me",
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

// Deautorizeaza utilizatorul.
export async function logout():Promise<boolean> {

    const logoutRequest = new Request("/api/auth/me/logout",
        {
            method:"POST",
            credentials:"include"
        });

    const logoutResponse = await fetch(logoutRequest);
    if(logoutResponse.ok)
        return true
    else throw new CustomError("Could not log out.", 500)

}

// Sterge utilizatorul curent
export async function deleteUser() {

    const req = new Request("/api/auth/me/delete",  {
        method:"DELETE"
    })

    const response = await fetch(req)

    if (!response.ok) {
        switch (response.status) {
            case 403:
                throw new CustomError("You are not authorized to delete this account.", 403)
        }
    }
}

// Cauta un formular dupa id si il returneaza (daca il gaseste).
export async function getForm(formId:string):Promise<FormInfo|undefined> {

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

// Returneaza toate formularele utilizatorului, sub forma minimala.
export async function getForms():Promise<Array<MinimalFormInfo>|undefined> {

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

// Adauga un nou formular.
export async function addForm(form:NewForm):Promise<string|undefined> {

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

// Actualizeaza un formular cu datele noi (in stil overwrite).
export async function updateForm({newFormData, formId}:{newFormData: NewForm, formId: string}) {

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

// Sterge un formular.
export async function deleteForm(formId:string):Promise<boolean|undefined> {

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

// Returneaza datele despre raspunsurile la un formular (cautat dupa id).
export async function getFormSubmissionData(formId:string):
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

// Publica un formular.
export async function publishForm(formId:string):Promise<boolean|undefined> {

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

// Inchide un formular.
export async function closeForm(formId:string):Promise<boolean|undefined> {

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

// Adauga un nou template.
export async function createTemplate({templateData, type}:{templateData:NewForm, type:'official'|undefined}):Promise<string|undefined> {

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

// Returneaza toate template-urile utilizatorului, sub format minimal.
export async function getTemplates({type}:{type:'public'|'mine'|'official'}):Promise<Array<MinimalTemplate>|undefined> {

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

// Returneaza un singur template, dupa id.
export async function getTemplate({templateId}:{templateId:string}):Promise<Template|undefined> {

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

// Actualizeaza un template cu datele noi (in stil overwrite).
export async function updateTemplate({templateId, newTemplateData}:{templateId:string, newTemplateData:NewForm}):Promise<boolean|undefined> {


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

// Sterge template-ul cu id-ul specificat.
export async function deleteTemplate({templateId}:{templateId:string}):Promise<boolean|undefined> {


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

// Trimite cerere de distribuire de chei de acces la formularul cu id-ul specificat, la email-urile specificate.
export async function distributeKeys({emails, formId}:{emails: Email[], formId: string}):Promise<boolean|undefined> {

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
