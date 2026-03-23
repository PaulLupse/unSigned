import config from '../config.json'
import {FormInfo, type Submission} from "../domain/types";
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
type formInfoSchemaType = z.TypeOf<typeof formInfoSchema>
type SubmissionSchemaType = z.TypeOf<typeof submissionSchema>


export async function use_key(key:string):Promise<undefined|FormInfo> {
    try {
        const useKeyRequest :Request = new Request(baseURL+'/sub-users/use-key',
            {
                method:'post',
                headers:{
                    'Accept': "application/json",
                    'Content-Type': "application/json"
                },
                body:JSON.stringify({
                    key:key
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

export async function submit_form(key:string, submission:SubmissionSchemaType):Promise<boolean> {

    try {

        // verificam daca submission-ul este de forma schemei de submission-uri
        submissionSchema.parse(submission);

        const submitFormRequest = new Request(baseURL+'/sub-users/submit-form',
            {
                method:'POST',
                headers:{
                    'Accept':'application/json',
                    "Content-Type":'application/json'
                },
                body:JSON.stringify({
                    key:key,
                    submission:submission
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