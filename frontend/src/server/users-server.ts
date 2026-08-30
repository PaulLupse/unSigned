// acest script contine parte din logica de comunicare cu serverul web, precum logare, inregistrare si operati CRUD

import {CredentialError, CustomError} from "src/utilities/Utilities";

import {
    type FormInfo,
    type NewForm,
    type MinimalFormInfo,
    type Email,
    type MinimalTemplate, type Template, type TextQuestionAnswerStatistic, type GridQuestionAnswerStatistic
} from "src/domain/types";
import {
    formInfoSchema,
    minimalFormInfoSchema,
    minimalTemplateSchema,
    templateSchema
} from "src/domain/schemas";
import {fetch} from "src/utilities/Utilities";
const requestWithPayloadHeaders = new Headers({
        'Accept': "application/json",
        'Content-Type': "application/json"
    });


// Cauta un formular dupa id si il returneaza (daca il gaseste).
export async function getForm(formId:string):Promise<FormInfo|undefined> {

    const getItemsRequest = new Request(
        `/api/form/${formId}`,
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
export async function getForms({user_id}:{user_id:string}):Promise<Array<MinimalFormInfo>|undefined> {

    const getItemsRequest = new Request(
        `/api/user/${user_id}/forms`,
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


    const createItemRequest = new Request("/api/form/add",
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

    const updateFormRequest:Request = new Request(`/api/form/${formId}/edit`,
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

    const deleteRequest:Request = new Request(`/api/form/${formId}/delete`,
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

    const getDataRequest = new Request(`/api/form/${formId}/submission-data`,
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
export async function openForm(formId:string):Promise<boolean|undefined> {

    const publishRequest = new Request(`/api/form/${formId}/open`, {
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

    const closeRequest = new Request(`/api/form/${formId}/close`, {
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

    const route:string = type==undefined?"/api/template/create":"/api/admin/official-templates/create"

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
export async function getTemplates({type, userId}:{type:'public'|'private'|'official', userId?:string}):Promise<Array<MinimalTemplate>|undefined> {

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

    const getTemplateRequest = new Request(`/api/template/${templateId}`, {
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

    const editTemplateRequest = new Request(`/api/template/${templateId}/edit`, {
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


    const route:string = `/api/template/${templateId}/delete`

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

    const distKeysRequest = new Request(`/api/form/${formId}/distribute_keys`,
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
