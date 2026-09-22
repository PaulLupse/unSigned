// acest script contine parte din logica de comunicare cu serverul web, precum logare, inregistrare si operati CRUD

import {CredentialError, CustomError, handleGenericErrorResponses, log} from "src/utilities";

import {
    type FormInfo,
    type NewForm,
    type FormSummary,
    type TemplateSummary, type Template, type TextQuestionStatistic, type GridQuestionStatistic
} from "src/domain/types";
import {
    formSchema,
    formSummarySchema,
    templateSummarySchema,
    templateSchema
} from "src/domain/schemas";
import {fetch} from "src/utilities";
import {BAD_USER_DATA_ERR, REQUEST_WITH_PAYLOAD_HEADERS} from "src/common";
import {userDataWithStatsSchema, userSchema} from "src/domain/auth-schemas";
import type {Email, User, UserDataWithStats, UserStats} from "src/domain/auth-types";




// Returneaza datele despre un utilizator.
// TODO: implementeaza profile de utilizator private
export async function getUserData({userId, username}:{userId?:string, username?:string}):Promise<User|undefined> {

    if (userId === username === undefined)
        throw new Error("No user identifier provided.")

    let uri = ''
    if(username)
        uri = `/api/user/@${username}`
    else uri = `/api/user/${userId}`

    const request = new Request(uri,
        {
            method:"GET"
        }
    )

    const response = await fetch(request)

    if (response.ok) {
        const data = await response.json()

        const parseResult = userSchema.safeParse(data)
        if (parseResult.success) return parseResult.data
        else {
            log(parseResult.error)
            throw new Error("Bad user data coming from backend-connection")
        }
    }

    if (response.status == 404) throw new Error("User not found")

    handleGenericErrorResponses(response)
}


export async function getUserDataAndStats({userId, username}:{userId?:string, username?:string}):Promise<UserDataWithStats|undefined> {

    if (userId === username === undefined)
        throw new Error("No user identifier provided.")

    let uri:string
    if(username)
        uri = `/api/user/@${username}/stats`
    else uri = `/api/user/${userId}/stats`

    const request = new Request(uri,
        {
            method:"GET"
        }
    )

    const response = await fetch(request)

    if (response.ok) {

        const data = await response.json()

        const parseResult = userDataWithStatsSchema.safeParse(data)

        if(!parseResult.success) {
            log(parseResult.error)
            throw BAD_USER_DATA_ERR
        }

        return parseResult.data
    }

    if (response.status == 404) throw new Error("User not found")

    handleGenericErrorResponses(response)
}

// Cauta un formular dupa id si il returneaza (daca il gaseste).
export async function getForm(formId:string):Promise<FormInfo|undefined> {

    const getItemsRequest = new Request(
        `/api/form/${formId}`,
        {
            method:'GET',
            credentials:'include'
        });

    const response = await fetch(getItemsRequest);
    if (response.ok) {

        const data = await response.json();

        const dataParseResult = formSchema.safeParse(data);

        if (dataParseResult.success) {
            return dataParseResult.data
        } else {
            log("Wrong json coming from backend-connection:" + dataParseResult.error)
            throw new CustomError("Bad communication with backend-connection.", 500)
        }
    }
    if (response.status == 404)
        throw new CustomError("Form not found.", 404)

    if(response.status == 400)
            throw new CustomError("Invalid form id.", 401)

    handleGenericErrorResponses(response)
}

// Returneaza toate formularele utilizatorului, sub forma minimala.
export async function getForms({user_id}:{user_id:string}):Promise<Array<FormSummary>|undefined> {

    const getItemsRequest = new Request(
        `/api/user/${user_id}/forms`,
        {
            method:'GET',
            credentials:'include'
        });

    const response = await fetch(getItemsRequest);

    if (response.ok) {

        const data = await response.json();


        const parseResult = formSummarySchema.array().safeParse(data);
        if (parseResult.success) {
            return parseResult.data;
        } else {
            log("Wrong json coming from backend-connection:" + parseResult.error);
            throw new CustomError("Bad communication with backend-connection.", 500)
        }
    }

    handleGenericErrorResponses(response)
}

// Adauga un nou formular.
export async function addForm(form:NewForm):Promise<string|undefined> {


    const request = new Request("/api/form/add",
        {
            method:"POST",
            headers:REQUEST_WITH_PAYLOAD_HEADERS,
            body:JSON.stringify(form)
        }
    )
    const response = await fetch(request);

    if(response.ok) {

        const data = await response.json()
        log("DATA: " + data)

        if (!Object.hasOwn(data, "formId"))
            throw new Error("Could not get the created form.")

        return data.formId;
    }

    if(response.status == 409)
        throw new CustomError("Form with this name already exists.", 409)

    handleGenericErrorResponses(response)

}

// Actualizeaza un formular cu datele noi (in stil overwrite).
export async function updateForm({newFormData, formId}:{newFormData: NewForm, formId: string}) {

    log(newFormData)

    const updateFormRequest:Request = new Request(`/api/form/${formId}/edit`,
        {
            method:"PUT",
            headers:REQUEST_WITH_PAYLOAD_HEADERS,
            body:JSON.stringify({
                name:newFormData.name,
                questions:newFormData.questions
            })
        });

    const response = await fetch(updateFormRequest);

    if (response.ok) return;

    if(response.status == 404)
        return new CustomError("Form not found.", 404);

    handleGenericErrorResponses(response)
}

// Sterge un formular.
export async function deleteForm(formId:string):Promise<boolean|undefined> {

    const deleteRequest:Request = new Request(`/api/form/${formId}/delete`,
        {
            method:'DELETE'
        }
    );

    const deleteResponse = await fetch(deleteRequest);

    if(deleteResponse.ok) return

    if(deleteResponse.status == 404)
        throw new CustomError("Form does not exist.", 404)

    handleGenericErrorResponses(deleteResponse)
}

// Returneaza datele despre raspunsurile la un formular (cautat dupa id).
// TODO adauga validare a datelor returnate de api folosind scheme zod
export async function getFormSubmissionData(formId:string):
    Promise<Array<TextQuestionStatistic|GridQuestionStatistic>|undefined> {

    const request = new Request(`/api/form/${formId}/submission-data`,
        {
            method:'GET'
        })

    const response = await fetch(request)

    if (response.ok)
        return await response.json()

    if (response.status == 404)
        throw new Error("Form not found.")

    handleGenericErrorResponses(response)
}

// Publica un formular.
export async function openForm(formId:string):Promise<boolean|undefined> {

    const publishRequest = new Request(`/api/form/${formId}/open`, {
            method:"POST"
        })

    const publishResponse = await fetch(publishRequest);

    if (publishResponse.ok) {
        return true;
    }

    if (publishResponse.status == 404)
        throw new CustomError("Form does not exist.", 404)
    if (publishResponse.status == 409)
        throw new CustomError("Form already closed.", 409)

    handleGenericErrorResponses(publishResponse)
}

// Inchide un formular.
export async function closeForm(formId:string):Promise<boolean|undefined> {

    const closeRequest = new Request(`/api/form/${formId}/close`, {
            method:"POST"
        })

    const closeResponse = await fetch(closeRequest);

    if (closeResponse.ok)  return;

    if (closeResponse.status == 404)
        throw new CustomError("Form does not exist.", 404)
    else if(closeResponse.status == 409)
        throw new CustomError("Form not published.", 409)

    handleGenericErrorResponses(closeResponse)
}

// Adauga un nou template.
export async function createTemplate({templateData, type}:{templateData:NewForm, type:'official'|undefined}):Promise<string|undefined> {

    const route:string = type==undefined?"/api/template/create":"/api/admin/official-templates/create"

    const createItemRequest = new Request(route,
        {
            method:"POST",
            headers:REQUEST_WITH_PAYLOAD_HEADERS,
            body:JSON.stringify(templateData)
        }
    )
    const createItemResponse = await fetch(createItemRequest);
    if(createItemResponse.ok) {

        const data = await createItemResponse.json()

        if (!Object.hasOwn(data, 'formId')) throw new Error("Could not get created template id.")

        return data.formId;
    }

    if(createItemResponse.status == 409)
        throw new CustomError("Form with this name already exists.", 409)
    if(createItemResponse.status == 400)
        throw new CustomError("Invalid form structure.", 400)

    handleGenericErrorResponses(createItemResponse)
}

// Returneaza toate template-urile utilizatorului, sub format minimal.
export async function getTemplates({type, userId}:{type:'public'|'private'|'official', userId?:string}):Promise<Array<TemplateSummary>|undefined> {

    let uri:string

    if (type !== 'private')
        uri = `/api/template/${type}`
    else {
        if (!userId) throw new Error("User id must be provided when accessing private templates.")
        uri = `/api/user/${userId}/templates`
    }

    const getTemplatesRequest = new Request(uri, {
        method:"GET"
    })

    const getTemplatesResponse = await fetch(getTemplatesRequest)

    if(getTemplatesResponse.ok) {
        
        const parseResult = templateSummarySchema.array().safeParse(await getTemplatesResponse.json())
        if (parseResult.success) {
            return parseResult.data
        } else {
            throw new Error("Bad data coming from backend-connection . . .")
        }
    }

    handleGenericErrorResponses(getTemplatesResponse)
}

// Returneaza un singur template, dupa id.
export async function getTemplate({templateId}:{templateId:string}):Promise<Template|undefined> {

    const getTemplateRequest = new Request(`/api/template/${templateId}`, {
        method:"GET"
    })

    const getTemplateResponse = await fetch(getTemplateRequest)

    if(getTemplateResponse.ok) {

        const parseResult = templateSchema.safeParse(await getTemplateResponse.json())

        if (parseResult.success) {
            return parseResult.data
        } else {
            throw new Error("Bad data coming from backend-connection . . . ")
        }
    }

    if (getTemplateResponse.status == 404)
        throw new CustomError("Template not found", 404)
    if(getTemplateResponse.status == 400)
        throw new CustomError("Invalid template id.", 401)
    if(getTemplateResponse.status == 403)
        throw new CustomError("Unauthorized to view template", 403)

    handleGenericErrorResponses(getTemplateResponse)

}

// Actualizeaza un template cu datele noi (in stil overwrite).
export async function updateTemplate({templateId, newTemplateData}:{templateId:string, newTemplateData:NewForm}):Promise<boolean|undefined> {

    const editTemplateRequest = new Request(`/api/template/${templateId}/edit`, {
        method:"PUT",
        body:JSON.stringify(newTemplateData),
        headers:REQUEST_WITH_PAYLOAD_HEADERS
    })

    const editTemplateResponse = await fetch(editTemplateRequest)

    if (editTemplateResponse.ok) return true;

    if (editTemplateResponse.status==404)
        throw new Error("Form not found")

    if(editTemplateResponse.status == 403)
        throw new CustomError("Unauthorized to edit template", 403)

    handleGenericErrorResponses(editTemplateResponse)
}

// Sterge template-ul cu id-ul specificat.
export async function deleteTemplate({templateId}:{templateId:string}):Promise<boolean|undefined> {


    const route:string = `/api/template/${templateId}/delete`

    const deleteTemplateRequest = new Request(route, {
        method:'DELETE'
    })

    const deleteTemplateResponse = await fetch(deleteTemplateRequest)

    if(deleteTemplateResponse.ok) return true;

    if (deleteTemplateResponse.status == 404) throw new CustomError("Form does not exist.", 404)
    if (deleteTemplateResponse.status == 403) throw new CustomError("Unauthorized to delete template", 403)

    handleGenericErrorResponses(deleteTemplateResponse)

}

// Trimite cerere de distribuire de chei de acces la formularul cu id-ul specificat, la email-urile specificate.
export async function distributeKeys({emails, formId}:{emails: Email[], formId: string}):Promise<boolean|undefined> {

    const distKeysRequest = new Request(`/api/form/${formId}/distribute_keys`,
        {
            method:'POST',
            headers: REQUEST_WITH_PAYLOAD_HEADERS,
            body:JSON.stringify({emails:emails})
        })

    const distKeysResponse = await fetch(distKeysRequest);

    if(distKeysResponse.ok)
        return true

    handleGenericErrorResponses(distKeysResponse)
}
