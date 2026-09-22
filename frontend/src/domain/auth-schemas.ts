import {z} from "zod";

export const credentialsSchema = z.object({
    identifier: z.string().min(1, "This field is required!"),
    password: z.string().min(1, "This field is required!")
});
export const emailSchema = z.object({
    email: z.string().min(1, "Field required!").regex(/\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, "Invalid email!")
})
export const userSchema = z.object({
    username: z.string(),
    id: z.string(),
    isAdmin: z.boolean(),
    email: z.string()
})
export const userStatsSchema = z.object({
    formCount: z.int(),
    templateCount: z.int()
})
export const userDataWithStatsSchema = z.object({
    stats: userStatsSchema,
    user: userSchema
})
export const registerData = z.object({
    username: z.string().min(1, "Field required!"),
    password: z.string().min(1, "Field required!"),
    email: z.string()
        .min(1, "Field required!")
        .regex(/\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/, "Invalid email!")
})