import {zGridChoice} from "src/domain/schemas";
import {z} from "zod";

export * from 'src/client/types.gen'

export type GridChoice = z.infer<typeof zGridChoice>