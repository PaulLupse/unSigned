import {useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {get_forms, get_templates} from "src/frontend/server/users-server";
import {Table} from "src/frontend/components/Table/Table";
import type {MinimalFormInfo, MinimalTemplate} from "src/frontend/domain/types";
import {makePair} from "src/frontend/Utilities";
import {NavButton} from "src/frontend/components/Buttons/Buttons";
import React, {useEffect} from "react";
import Loading from "src/frontend/components/Loading";

export function DisplayTemplates() {

    const navigate = useNavigate();

    const getTemplates = useQuery({
        queryFn:get_templates,
        queryKey:['templates']
    })

    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        getTemplates.isLoading?<Loading />:
        <div style={{
            display:'grid',
            justifyItems:'center'
        }}>
            <div id="display" style={{

                width:'100%',
                maxWidth:'500px',
                boxSizing:"border-box",

                display:'grid',
                gridTemplateColumns: '1fr',

                padding:'20px',
                margin:'1rem',
                gap:'10px'
            }}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>

                    <h3 style={{width:'100%', boxSizing:'border-box'}}>My Templates</h3>

                    {
                        getTemplates.isSuccess&&
                            <Table<MinimalTemplate> columns={["Name", "# of questions"]}
                                                    columnNames={['name', "questionCount"]}
                                                    data={getTemplates.data?getTemplates.data:[]}
                                                    rowOnClick={(minimalTemplate:MinimalTemplate)=>navigate(`/template/${minimalTemplate.id}/view`)}
                                                    style={{width:'100%', boxSizing:'border-box'}}/>
                    }

                    <NavButton to={"/template/create"} style={{height:'3rem', aspectRatio:'1/1'}}>
                        +
                    </NavButton>
                </div>
            </div>
        </div>
    );

}

export function DisplayForms() {

    const navigate = useNavigate();

    const getForms = useQuery({
        queryFn:get_forms,
        queryKey:['forms'],
        retry:0,
        refetchOnWindowFocus:false
    })

    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        getForms.isLoading?<Loading />:
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
                        getForms.isSuccess&&
                    <Table<MinimalFormInfo> columns={["Name", "Date created", "Date published", "Date closed" , "Submissions"]}
                                     columnNames={['name',
                                         makePair('dateCreated', (date:Date)=>date?date.toISOString().split('T')[0]:'-'),
                                         makePair('datePublished', (date:Date|null)=>date?date.toISOString().split('T')[0]:'-'),
                                         makePair('dateClosed', (date:Date|null)=>date?date.toISOString().split('T')[0]:'-'),
                                         'submissionsCount']}
                                     data={getForms.data?getForms.data:[]}
                                     rowOnClick=
                                        {(form:MinimalFormInfo):void => {
                                            console.log(form.id)
                                            navigate(`/form/${form.id}/view`);
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