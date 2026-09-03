import React from "react";
import {useQuery} from "@tanstack/react-query";
import {getTemplate} from "src/server/users-server";
import {Outlet, useParams} from "react-router-dom";
import type {Template} from "src/domain/types";
import Loading from "src/components/Loading";


export default function Template() {

    const templateId = useParams().templateId as string;

    const {isLoading, isError, data, error} = useQuery({
        queryFn:async():Promise<Template|undefined>=>getTemplate({templateId}),
        queryKey:['template'],
        retry:0,
        refetchOnWindowFocus:false
    })

    return (

        isLoading?
        <Loading />
            :
        isError?
        <div className={'loading'}>
            <h2>
                {error.message}
            </h2>
        </div>
            :
        <Outlet context={{template:data}} />

    )
}