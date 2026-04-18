import React, {useMemo, useState} from 'react'
import {createRoot} from "react-dom/client";
import {
    BrowserRouter,
    Link, Navigate,
    Outlet,
    Route,
    Routes, useLocation, useNavigate,
    useOutletContext
} from "react-router-dom";
import {
    useQueryClient,
    QueryClient,
    QueryClientProvider, useQuery
} from "@tanstack/react-query";
import {AlertProvider} from "./components/AlertProvider";

import '../../static/css/general.css'


import {auto_login, get_forms, logout, delete_form} from "./user/back-end-connection";
import {Table} from "./components/Table/Table";
import type {FormInfo, MinimalFormInfo, Submission} from "./domain/types";
import {makePair} from "./Utilities";


import FormCreator from "./user/form-creator";
import {ViewForm, DisplayFrom} from "./user/view-form";
import {DisplaySubmissionData} from "./user/view-submission-data";
import {
    BaseComponent,
    FormIdInputComponent,
    KeyInputComponent,
    ShowFormComponent,
    SubUsersMain
} from "./sub-user/complete-form";
import { StyledEngineProvider } from '@mui/material/styles';

import {LoginComponent, RegisterComponent} from "./user/login";
import NavBar from "./components/NavBar/NavBar";
import {DistributeKeys} from "./user/distribute-keys";
import SideBar from "./components/SideBar/BetterSideBar";
import {Toaster} from "react-hot-toast";


const baseURL:string = '';


interface DataProps {
    username:string
}

function NotLoggedInPanel() {
    return (
            <div
                style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
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
                                        navigate(`view-form/${form.id}`);
                                    }}
                                style={{overflowX:'auto'}}
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

    const {username}:{username:any} = useOutletContext();

    //  <SideBar isOpen={sidebarIsOpen} setIsOpen={setSidebarIsOpen} anchor={'right'} />
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

function Index() {

    const loc = useLocation();
    const nav = useNavigate();

    const queryClient = useQueryClient();
    const {isSuccess, data, isLoading, isError, isStale} = useQuery({queryKey: ['username'], queryFn:auto_login, retry:0, refetchOnWindowFocus:true})
    const username:string|null = useMemo(()=>data?data:null,[data]);

    const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

    React.useEffect(()=> {
            if(isError) {
                if (!['/', '/login', '/register'].includes(loc.pathname))
                    nav('/');
            }
        },
        [isStale, isError, isLoading]
    );

    return (

        <div id="Pagina intreaga"
            style={{

                display:'grid',
                gridTemplateRows:'auto 1fr',
                height:"100dvh",
                minWidth:'320px',
                overflowY:"auto"}}>

            <Toaster position="top-center" />

            <NavBar
                sidebarIsOpen={sidebarIsOpen}
                setSidebarIsOpen={setSidebarIsOpen}
                isLoading={isLoading}
                isSuccess={isSuccess}
                username={username}
                queryClient={queryClient} />

            <SideBar isOpen={sidebarIsOpen} setIsOpen={setSidebarIsOpen} anchor={'right'} />
            {
                isLoading?
                <div style={{display:"grid", placeContent:"center"}}>
                    <p>
                        Loading . . .
                    </p>
                </div>:
                    <Outlet  context={{username:isSuccess?username:""}}/>
            }




        </div>


    );
}


window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv);
    const queryClient = new QueryClient();
    root.render(
        <QueryClientProvider client={queryClient} >
            <AlertProvider>
                <StyledEngineProvider injectFirst={true}>
                    <BrowserRouter>
                        <Routes>
                            <Route path='/' element={<Index />}>
                                <Route path='login' element={<LoginComponent />}/>
                                <Route path='register' element={<RegisterComponent />}/>
                                <Route index element={<DefaultContent />} />
                                <Route path='create-new-form' element={<FormCreator />} />
                                <Route path='view-form/:formId' element={<ViewForm />}>
                                    <Route index element={<DisplayFrom />} />
                                    <Route path='submissions' element={<DisplaySubmissionData />} />
                                    <Route path='keys' element={<DistributeKeys />}/>
                                </Route>
                            </Route>
                            {/* ruta /complete-form este separata de ruta principala deoarece este menita sa fie accesata de sub-utilizatori */}
                            <Route path='complete-form' element={<SubUsersMain />}>
                                <Route index element={<FormIdInputComponent />}></Route>
                                <Route path={":formId"} element={<BaseComponent />}>
                                    <Route index element={<KeyInputComponent />} ></Route>
                                    <Route path={"complete"} element={<ShowFormComponent />} ></Route>
                                </Route>
                            </Route>
                            <Route path='/*' element={<Navigate to={'/'} replace={true} />} ></Route>
                        </Routes>
                    </BrowserRouter>
                </StyledEngineProvider>
            </AlertProvider>
        </QueryClientProvider>
    );
}

