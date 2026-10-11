import z from "zod";

export {zUser, zUserStats, zUserProfileWithStats} from "src/client/zod.gen"



export const zCredentials = z.object({
    identifier: z.string().min(1, "This field is required!"),
    password: z.string().min(1, "This field is required!")
});
export const zEmail = z.object({
    email: z.string().min(1, "Field required!").regex(/\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, "Invalid email!")
})
export const zRegisterData = z.object({
    username: z.string().min(1, "Field required!"),
    password: z.string().min(1, "Field required!"),
    email: z.string()
        .min(1, "Field required!")
        .regex(/\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, "Invalid email!")
})