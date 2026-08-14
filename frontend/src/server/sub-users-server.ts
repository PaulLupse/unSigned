import {type FormInfo, type Submission} from "../domain/types";
import {z} from 'zod'
import {formInfoSchema, submissionSchema} from "../domain/schemas";

const baseURL:string = ''

const UseKeyResponseSchema = z.object(
    {
        message:z.string(),
        form:formInfoSchema
    }
);
type UseKeyResponseType = z.TypeOf<typeof UseKeyResponseSchema>;


export async function check_form_id(formId:string):Promise<boolean|undefined> {
    const checkFormIdRequest = new Request(baseURL + `/api/sub-users/check/${formId}`, {
        method:'POST',
        body:JSON.stringify({formId:formId}),
        headers:{
            'Accept': "application/json",
            'Content-Type': "application/json"
        },
    })
    const checkFormIdResponse = await fetch(checkFormIdRequest);
    if(checkFormIdResponse.ok)
        return true;
    else if(checkFormIdResponse.status == 404)
        throw new Error("Form not found.")
}

export async function check_key({key, formId}: { key: string, formId: string }):Promise<void> {
    const checkKeyRequest = new Request(baseURL + '/api/sub-users/check-key', {
        method:'POST',
        body:JSON.stringify({key:key, formId:formId}),
        headers:{
            'Accept': "application/json",
            'Content-Type': "application/json"
        },
    })
    const checkKeyResponse = await fetch(checkKeyRequest);
    if(checkKeyResponse.status == 400) throw new Error("Invalid key.")
    else if(checkKeyResponse.status == 410) throw new Error("Form deleted.")
    else if(checkKeyResponse.status == 423) throw new Error("Form unavailable.")
}

export async function use_key({k, formId}:{k: string, formId: string}):Promise<FormInfo|undefined> {

    if (k === '') throw new Error("Please input key again.")

    const useKeyRequest :Request = new Request(baseURL+'/api/sub-users/use-key',
        {
            method:'post',
            headers:{
                'Accept': "application/json",
                'Content-Type': "application/json"
            },
            body:JSON.stringify({
                key: k,
                formId:formId
            })
        }
    );

    const useKeyResponse:Response = await fetch(useKeyRequest);
    if (useKeyResponse.ok) {

        const data:UseKeyResponseType = UseKeyResponseSchema.parse(await useKeyResponse.json());
        return data.form
    }
    else {
        if(useKeyResponse.status == 400) throw new Error("Invalid key.")
        else if(useKeyResponse.status == 410) throw new Error("Form deleted.")
        else if(useKeyResponse.status == 423) throw new Error("Form unavailable.")
    }
}

export async function submit_form({key, formId, submission}:{key: string, formId: string, submission: Submission}):Promise<void> {

    // verificam daca submission-ul este de forma schemei de submission-uri
    const parseResult = submissionSchema.safeParse(submission);
    if(!parseResult.success) {
        throw new Error("Invalid submission parameters.")
    }

    const submitFormRequest = new Request(baseURL+'/api/sub-users/submit-form',
        {
            method:'POST',
            headers:{
                'Accept':'application/json',
                "Content-Type":'application/json'
            },
            body:JSON.stringify({
                key:key,
                submission:submission,
                formId:formId
            })
        })

    const submitFormResponse = await fetch(submitFormRequest);
    if(!submitFormResponse.ok) {
        if(submitFormResponse.status == 400) throw new Error("Invalid key.")
        else if(submitFormResponse.status == 410) throw new Error("Form deleted.")
        else if(submitFormResponse.status == 423) throw new Error("Form unavailable.")
    }
}