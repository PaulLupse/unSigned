import {zCredentials, zEmail, zRegisterData} from "src/auth/schemas";
import {z} from "zod";

export type {User, UserStats, UserProfileWithStats} from "src/client/types.gen"
export type Credentials = z.infer<typeof zCredentials>
export type Email = z.infer<typeof zEmail>
export type RegisterData = z.infer<typeof zRegisterData>