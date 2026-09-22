import type { FormInfo} from "src/domain/types";
import {getForm} from "src/backend-connection/users";
import React, {useEffect} from "react";


import {Outlet, useNavigate, useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import Loading from "src/components/Loading";

export function Form() {

    const formId = useParams().formId as string;
    const nav = useNavigate();

    const {data, isLoading, isError, error} = useQuery({
        queryKey:["form"],
        queryFn:async():Promise<FormInfo|undefined>=>getForm(formId),
        retry:0,
        refetchOnWindowFocus:false
    })

    useEffect(()=>{
        if (isError) nav('/me/forms')
    }, [isLoading, isError])

    // daca nu punem conditia de loading, crapa codu la refresh in /submissions ca nu apuca sa dea fetch
    return (
        isLoading?
            <Loading />:
            isError?
                <div className={'loading'}>
                    <h2>
                        {error?.message}
                    </h2>
                </div>:
            <Outlet context={data}/>
    )
}