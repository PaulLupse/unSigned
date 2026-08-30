import {useLocation, useNavigate, useOutletContext} from "react-router-dom";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {getTemplates} from "src/server/users-server";
import Loading from "src/components/Loading";
import {Table} from "src/components/Table/Table";
import type {MinimalTemplate, User} from "src/domain/types";
import {BackButton, NavButton} from "src/components/Buttons/Buttons";
import React, {useMemo} from "react";
import {FixedElement} from "src/components/FixedElement/FixedElement";
import {userSchema} from "src/domain/schemas";

export function ListTemplates() {

    const navigate = useNavigate();
    const loc = useLocation();
    const qC = useQueryClient();
    const context = useOutletContext<{user:User}>()

    const user:User|undefined = useMemo(()=>{
        const parseResult = userSchema.safeParse(context.user)
        if(parseResult.success)
            return parseResult.data
    }, [context])

    const pathSegments = loc.pathname.split('/')
    const type:'public'|'private'|'official' = pathSegments[pathSegments.length - 1] as 'public'|'private'|'official'
    let dispayText :string = ''

    switch (type){
        case "public":
            dispayText='Public'; break
        case 'private':
            dispayText="My"; break
        default:
            dispayText="Official"; break
    }


    const getUserTemplates = useQuery({
        queryFn:async()=>await getTemplates({type:type, userId:user?.id}),
        queryKey:['templates']
    })

    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        getUserTemplates.isLoading ? <Loading /> :
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

                    <h3 style={{width:'100%', boxSizing:'border-box'}}>{dispayText} templates</h3>

                    {
                        getUserTemplates.isSuccess&&
                            <Table<MinimalTemplate> columns={["Name", "# of questions"]}
                                                    columnNames={['name', "questionCount"]}
                                                    data={getUserTemplates.data?getUserTemplates.data:[]}
                                                    rowOnClick={(minimalTemplate:MinimalTemplate)=>navigate(`/templates/${minimalTemplate.id}/view`)}
                                                    style={{width:'100%', boxSizing:'border-box'}}/>
                    }
                    {
                        (type=='private' || (type=='official' && user?.isAdmin)) &&
                        <NavButton to={"/templates/create" + (type==='official'?'/official':'')} style={{height: '3rem', aspectRatio: '1/1'}}>
                            +
                        </NavButton>
                    }
                </div>

                <FixedElement style={{maxWidth:'200px'}}>
                    <NavButton to={-1} onClick={async ()=>{qC.removeQueries({queryKey:['templates']})}}>
                        Back
                    </NavButton>
                </FixedElement>
            </div>
        </div>
    );

}