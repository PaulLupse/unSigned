import {type FormInfo, type Submission} from "src/domain/types";
import {z} from 'zod'
import {formInfoSchema, submissionSchema} from "src/domain/schemas";
import {fetch} from "src/utilities/Utilities";
import {REQUEST_WITH_PAYLOAD_HEADERS} from "src/common";

const UseKeyResponseSchema = z.object(
    {
        message:z.string(),
        form:formInfoSchema
    }
);
type UseKeyResponseType = z.TypeOf<typeof UseKeyResponseSchema>;

function handleGenericErrorResponses(response:Response) {
    
    if(response.status == 400) throw new Error("Invalid key.")
    if(response.status == 410) throw new Error("Form deleted.")
    if(response.status == 423) throw new Error("Form unavailable.")
    
    throw new Error("Internal server error.")
}

// Verifica existenta formularului
export async function checkFormId(formId:string):Promise<boolean|undefined> {
    const checkFormIdRequest = new Request(`/api/sub-user/check/${formId}`, {
        method:'POST',
        body:JSON.stringify({formId:formId}),
        headers:REQUEST_WITH_PAYLOAD_HEADERS
    })
    const checkFormIdResponse = await fetch(checkFormIdRequest);
    if(checkFormIdResponse.ok)
        return true;
    
    handleGenericErrorResponses(checkFormIdResponse)
}

// Verifica cheia
export async function checkKey({key, formId}: { key: string, formId: string }):Promise<void> {
    const checkKeyRequest = new Request('/api/sub-user/check-key', {
        method:'POST',
        body:JSON.stringify({key:key, formId:formId}),
        headers:REQUEST_WITH_PAYLOAD_HEADERS
    })
    const checkKeyResponse = await fetch(checkKeyRequest);
    
    if (checkKeyResponse.ok) return

    handleGenericErrorResponses(checkKeyResponse)
}

// Utilizeaza cheia pentru a obtine formularul
export async function useKey({k, formId}:{k: string, formId: string}):Promise<FormInfo|undefined> {

    if (k === '') throw new Error("Please input key again.")

    const useKeyRequest :Request = new Request('/api/sub-user/use-key',
        {
            method:'post',
            headers:REQUEST_WITH_PAYLOAD_HEADERS,
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
    
    handleGenericErrorResponses(useKeyResponse)
}

// Trimite o submisie, utilizand cheia introdusa
export async function submitForm({key, formId, submission}:{key: string, formId: string, submission: Submission}):Promise<void> {

    // verificam daca submission-ul este de forma schemei de submission-uri
    const parseResult = submissionSchema.safeParse(submission);
    if(!parseResult.success) {
        throw new Error("Invalid submission parameters.")
    }

    const submitFormRequest = new Request('/api/sub-user/submit-form',
        {
            method:'POST',
            headers:REQUEST_WITH_PAYLOAD_HEADERS,
            body:JSON.stringify({
                key:key,
                submission:submission,
                formId:formId
            })
        })

    const submitFormResponse = await fetch(submitFormRequest);
    
    if (submitFormResponse.ok) return
    
    handleGenericErrorResponses(submitFormResponse)
}