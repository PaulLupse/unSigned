import type { FormInfo} from "../../domain/types";
import {get_form} from "./back-end-connection";
import React from "react";


import {Outlet, useNavigate, useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";

export function ViewForm() {

    const formId = useParams().formId as string;
    const navigate = useNavigate();

    let {data, isLoading, isError, error} = useQuery({
        queryKey:["form"],
        queryFn:async():Promise<FormInfo|undefined>=>get_form(formId),
        retry:1,
        refetchOnWindowFocus:false
    })

    // daca nu punem conditia de loading, crapa codu la refresh in /submissions ca nu apuca sa dea fetch
    return (
        isLoading?
            <div className={'loading'}>
                <h2>
                    Loading...
                </h2>
            </div>:
            isError?
                <div className={'loading'}>
                    <h2>
                        {error?.message}
                    </h2>
                </div>:
            <Outlet context={data}/>
    )
}