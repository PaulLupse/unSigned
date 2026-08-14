import React from "react";
import {useQuery} from "@tanstack/react-query";
import {get_form, get_template} from "src/server/users-server";
import {Outlet, useOutletContext, useParams} from "react-router-dom";
import type {FormInfo, User} from "src/domain/types";
import type {Template} from "src/domain/types";


export default function Template() {

    const templateId = useParams().templateId as string;

    const context = useOutletContext<{user:User}>()

    const {isLoading, isError, data, error} = useQuery({
        queryFn:async():Promise<Template|undefined>=>get_template({templateId}),
        queryKey:['template'],
        retry:0,
        refetchOnWindowFocus:false
    })

    return (

        isLoading?
        <div className={'loading'}>
            <h2>
                Loading . . .
            </h2>
        </div>
            :
        isError?
        <div className={'loading'}>
            <h2>
                {error.message}
            </h2>
        </div>
            :
        <Outlet context={{template:data, user:context.user}} />

    )
}