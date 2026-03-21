import config from '../config.json'
import {FormInfo} from "../domain/types";
import {z} from 'zod'

const baseURL:string = config.baseURL

const UseKeyResponseSchema = z.object(
    {
        message:z.string(),
        form:z.instanceof(FormInfo)
    }
);


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
            const {form} = await useKeyResponse.json();
            return form;
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