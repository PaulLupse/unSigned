import type {ToastManagerUpdateOptions} from "@base-ui/react";
import {toast as toaster} from "src/components/ui/toast"

export default class toast {

    public static success(message: string) {
        toaster.add({
            type: "success",
            description: message,
        })
    }

    public static error(message: string) {
        toaster.add({
            type: "error",
            description: message
        })
    }

    public static promise<T>(promise: Promise<T>, msgs: {
        loading: string | ToastManagerUpdateOptions<any>;
        success: string | ToastManagerUpdateOptions<any> | ((result: T) => string | ToastManagerUpdateOptions<any>);
        error: string | ToastManagerUpdateOptions<any> | ((error: any) => string | ToastManagerUpdateOptions<any>);
    }): Promise<T> {

        return toaster.promise(promise,
            {
                loading: msgs.loading,
                success: msgs.success,
                error: msgs.error
            })
    }
}