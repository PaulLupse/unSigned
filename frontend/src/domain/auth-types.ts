import {
    credentialsSchema,
    emailSchema,
    registerData,
    userDataWithStatsSchema,
    userSchema,
    userStatsSchema
} from "src/domain/auth-schemas";
import {z} from "zod";

export type Credentials = z.infer<typeof credentialsSchema>
export type Email = z.infer<typeof emailSchema>
export type User = z.infer<typeof userSchema>
export type UserStats = z.infer<typeof userStatsSchema>
export type UserDataWithStats = z.infer<typeof userDataWithStatsSchema>
export type RegisterData = z.infer<typeof registerData>