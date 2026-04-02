import config from '../config.json'
import {type FormInfo, type Submission} from "../domain/types";
import {z} from 'zod'
import {formInfoSchema, submissionSchema} from "../domain/schemas";

const baseURL:string = config.baseURL

const UseKeyResponseSchema = z.object(
    {
        message:z.string(),
        form:formInfoSchema
    }
);
type UseKeyResponseType = z.TypeOf<typeof UseKeyResponseSchema>;


export async function check_form_id(formId:string):Promise<boolean> {
    const checkFormIdRequest = new Request(baseURL + `/sub-users/check/${formId}`, {
        method:'POST',
        body:JSON.stringify({formId:formId}),
        headers:{
            'Accept': "application/json",
            'Content-Type': "application/json"
        },
    })
    const checkFormIdResponse = await fetch(checkFormIdRequest);
    return checkFormIdResponse.ok
}

export async function check_key(key:string, formId:string):Promise<boolean|string> {
    const checkKeyRequest = new Request(baseURL + '/sub-users/check-key', {
        method:'POST',
        body:JSON.stringify({key:key, formId:formId}),
        headers:{
            'Accept': "application/json",
            'Content-Type': "application/json"
        },
    })
    const checkKeyResponse = await fetch(checkKeyRequest);
    if(checkKeyResponse.ok)
        return true;
    return (await checkKeyResponse.json()).message
}

export async function use_key(k:string, formId:string):Promise<undefined|FormInfo> {

    try {
        const useKeyRequest :Request = new Request(baseURL+'/sub-users/use-key',
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
            console.log(data)

            return data.form
        }
        else {
            const {message} = await useKeyResponse.json();
            throw new Error("Failed to use key. Returned error message: " + message)
        }
    }
    catch(err) {
        alert(err);
        return undefined
    }
}

export async function submit_form(key:string, formId:string, submission:Submission):Promise<boolean> {

    try {

        // verificam daca submission-ul este de forma schemei de submission-uri
        const parseResult = submissionSchema.safeParse(submission);
        if(!parseResult.success) {
            console.log(submission)
            alert(parseResult.error)
            return false;
        }


        const submitFormRequest = new Request(baseURL+'/sub-users/submit-form',
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
        if(submitFormResponse.ok) {
            return true
        }
        else throw new Error("Could not submit form. Returned error message: "+((await submitFormResponse.json()).message))
    }
    catch(error) {
        alert(error);
        return false
    }
}