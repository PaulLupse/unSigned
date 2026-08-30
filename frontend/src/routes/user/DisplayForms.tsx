import {useNavigate, useOutletContext} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {getForms} from "src/server/users-server";
import {Table} from "src/components/Table/Table";
import type {MinimalFormInfo, User} from "src/domain/types";
import {makePair} from "src/utilities/Utilities";
import {NavButton} from "src/components/Buttons/Buttons";
import React from "react";
import Loading from "src/components/Loading";

export function DisplayForms() {

    const navigate = useNavigate();
    const outletContext = useOutletContext<{user:User}>()
    const user = outletContext.user

    const getUserForms = useQuery({
        queryFn:()=>getForms({user_id:user.id}),
        queryKey:['forms'],
        retry:0,
        refetchOnWindowFocus:false
    })

    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        getUserForms.isLoading?<Loading />:
        <div style={{
            display:'grid',
            justifyItems:'center'
        }}>
            <div id="display" style={{

                width:'100%',
                maxWidth:'1000px',
                boxSizing:"border-box",

                display:'grid',

                padding:'20px',
                margin:'1rem',
                gap:'10px'
            }}>

                <div style={{display:'grid', justifyItems:'center', gap:'10px'}}>

                    <h3 style={{width:'100%', boxSizing:'border-box'}}>My Forms</h3>

                    {
                        getUserForms.isSuccess&&
                    <Table<MinimalFormInfo> columns={["Name", "Date created", "Date published", "Date closed" , "Submissions"]}
                                     columnNames={['name',
                                         makePair('dateCreated', (date:Date)=>date?date.toISOString().split('T')[0]:'-'),
                                         makePair('datePublished', (date:Date|null)=>date?date.toISOString().split('T')[0]:'-'),
                                         makePair('dateClosed', (date:Date|null)=>date?date.toISOString().split('T')[0]:'-'),
                                         'submissionsCount']}
                                     data={getUserForms.data?getUserForms.data:[]}
                                     rowOnClick=
                                        {(form:MinimalFormInfo):void => {
                                            console.log(form.id)
                                            navigate(`/me/forms/${form.id}/view`);
                                        }}
                                    style={{overflowX:'auto', width:'100%'}}
                    />
                    }


                    <NavButton to={"/form/create"} style={{height:'3rem', aspectRatio:'1/1'}}>
                        +
                    </NavButton>
                </div>
            </div>
        </div>
    );
}