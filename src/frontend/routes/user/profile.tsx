import {Link, useNavigate, useOutletContext} from "react-router-dom";
import React from "react";
import type {MinimalFormInfo} from "../../domain/types";
import {get_forms} from "./back-end-connection";
import {Table} from "../../components/Table/Table";
import {makePair} from "../../Utilities";

interface DataProps {
    username:string
}

function NotLoggedInPanel() {
    return (
            <div
                style={{display:'flex', height:'100%', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                <h3>
                    You are not logged in.
                </h3>
                <Link to={'/login'}>Login</Link>
                <Link to={'/register'}>Register</Link>
            </div>
        )
}

function DataDisplay(props:DataProps) {

    const [formList, setFormList] = React.useState(Array<MinimalFormInfo>);
    const navigate = useNavigate();

    React.useEffect(()=> {
            async function getItems ():Promise<void> {
                const forms:Array<MinimalFormInfo>|undefined = await get_forms();

                if(forms) {
                    setFormList(forms);
                }
            }
            if(props.username!=="")
                getItems();
        },
        []
    );

    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        <div style={{
            display:'flex',
            justifyContent:'center'
        }}>
            <div id="display" style={{

                flexGrow:'1',
                maxWidth:'75rem',
                display:'flex',
                flexDirection:'column',
                overflowX:'auto',
                margin:'20px'
            }}>

                <h3 style={{
                    padding:'5px', textAlign:'center'
                }}>My Forms</h3>

                <Table<MinimalFormInfo> columns={["Name", "Date created", "Date published", "Date closed" , "Submissions"]}
                                 columnNames={['name',
                                     makePair('dateCreated', (date:Date)=>date?date.toISOString().split('T')[0]:'-'),
                                     makePair('datePublished', (date:Date|null)=>date?date.toISOString().split('T')[0]:'-'),
                                     makePair('dateClosed', (date:Date|null)=>date?date.toISOString().split('T')[0]:'-'),
                                     'submissionsCount']}
                                 data={formList}
                                 setData={setFormList}
                                 rowOnClick=
                                    {(form:MinimalFormInfo):void => {
                                        console.log(form.id)
                                        navigate(`/view-form/${form.id}`);
                                    }}
                                style={{overflowX:'auto'}}
                />


                <Link to={'/create-new-form'}>
                    <div style={{display:"flex", justifyContent:'center'}} className="table-button">
                        <p style={{margin:'0'}}>
                            New Form
                        </p>
                    </div>
                </Link>
            </div>
        </div>

    );
}

export function Profile() {

    const {username}:{username:any} = useOutletContext();
    return(
        <>
        {
            username !== ""?
            <DataDisplay username={username}/>
            :
            <NotLoggedInPanel />
        }
        </>
    );
}