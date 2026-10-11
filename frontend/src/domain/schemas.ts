import {z} from "zod";

export * from 'src/client/zod.gen'


export const zGridChoice = z.object({
    text:z.string().min(1, "Choice cannot be empty")
})

