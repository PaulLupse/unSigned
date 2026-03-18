import React from 'react'
import {createRoot} from "react-dom/client";
import {
    BrowserRouter,
    Link,
    Outlet,
    Route,
    Routes,
    useOutletContext
} from "react-router-dom";


import configFile from './config.json'
import {auto_login, get_forms, logout, delete_form} from "./user/back-end-connection";
import {Table} from "./components/Table";
import type {FormInfo, Submission} from "./domain/types";
import {makePair} from "./components/Utilities";
import CreateNewForm from "./user/create-new-form";
import ViewForm from "./user/view-form";


const baseURL:string = configFile.baseURL;


interface DataProps {
    username:string
    isLoggedIn:boolean
    divStyle:any
    gridStyle:any
}

function NotLoggedInPanel(props:{divStyle:any}) {
    return (
            <div id="not_logged_in_panel"
                style={props.divStyle}>
                <h3>
                    You are not logged in.
                </h3>
                <a href={baseURL + '/login'}>Login</a>
                <a href={baseURL + '/register'}>Register</a>
            </div>
        )
}

function DataDisplay(props:DataProps) {

    const [formList, setFormList] = React.useState(Array<FormInfo>);

    React.useEffect(()=> {
                    async function getItems ():Promise<void> {
                        const newItems:Array<FormInfo>|undefined = await get_forms();

                        if(newItems) {
                            setFormList(newItems);
                        }
                    }
                    if(props.isLoggedIn)
                        getItems();
                },
                []
            );


    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        <div style={props.gridStyle}>

            <div id="display" style={props.divStyle}>

                <h3 style={{padding:'5px', textAlign:'center'}}>My Forms</h3>

                <Table<FormInfo> columns={["Name", "Date created", "Date updated", "Submissions"]}
                                 dataFields={['name', 'dateCreated', 'dateUpdated', makePair('submissions',
                                     (subs:Array<Submission>):number=>subs?subs.length:0)]}
                                 data={formList}
                                 setData={setFormList}
                                 deleteButtonCallback=
                                     {(form:FormInfo):void => {
                                         delete_form(form.name);
                                         const newData = structuredClone(formList);
                                         newData.splice(formList.indexOf(form), 1);
                                         setFormList(newData);
                                     }}
                />


                <Link to={baseURL + '/create-new-form'}>
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

function DefaultContent() {

    const {isLoggedIn, username}:{isLoggedIn:any, username:any} = useOutletContext();

    return(
        <div id="Continut" style={{display:'flex', alignItems:'center', height:'80%', justifyContent:'center'}}>

                {isLoggedIn?
                    <DataDisplay username={username} isLoggedIn={isLoggedIn}
                                 // div style reprezinta stilul div-urilor din fiecare celula a grid-ului
                        divStyle={{display:'flex', flexDirection:'column', alignItems:'stretch', padding:'10px',
                            flexGrow:'1', justifyContent:'start', overflow:'auto'}}

                        gridStyle={{display:'grid', gridTemplateColumns:'1fr', width:'70%', height:'100%', alignItems:'start',
                            gap:'10px'}} />
                    :
                    <NotLoggedInPanel divStyle={{display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'10px',
                            paddingBottom:'10px', height:'90%', flexGrow:'1', justifyContent:'center'}} />
                }

            </div>
    );
}

function Main() {

    const [username, setUsername] = React.useState('');
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    // folosim un effect pentru a returna utilizatorul curent
    React.useEffect(()=> {
            async function getUser ():Promise<void> {
                const username:string|undefined = await auto_login();
                if(username) {
                    setUsername(username);
                    setIsLoggedIn(true);
                }
            }
            getUser();
        },
        []
    );

    return (
        <div id="Pagina intreaga"
            style={{display:"flex", flexDirection:"column", height:'100vh', minWidth:'300px', alignItems:'stretch',
            gap:'10px'}}>

            <div id="Bara de sus"
                style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
                borderBottom:'5px', borderBottomStyle:'double'}}>

                <div style={{display:"flex", alignItems:'center', gap:'10px', marginLeft:'10px'}}>
                    <p style={{textAlign:'center'}}>
                        Current user: {isLoggedIn?username:'none'}
                    </p>
                    {
                        isLoggedIn &&
                        <button
                            onClick={
                                async()=> {
                                    if (await logout()) {
                                        setUsername('');
                                        setIsLoggedIn(false);
                                    }
                                }
                            }
                        >
                            Log out
                        </button>
                    }
                </div>

                <div style={{flexGrow:'1'}}>
                    <h1 style={{textAlign:'center'}}>
                        Main Page
                    </h1>
                </div>

            </div>
            <Outlet context={{username:username, isLoggedIn:isLoggedIn}}/>

        </div>
    );
}


window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv);
    root.render(
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Main />}>
                    <Route index element={<DefaultContent />}></Route>
                    <Route path='create-new-form' element={<CreateNewForm />}></Route>
                    <Route path='view-form' element={<ViewForm />}></Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

