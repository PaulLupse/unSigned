import React, {useMemo} from 'react'
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


import configFile from './config.json'
import {auto_login, get_forms, logout, delete_form} from "./user/back-end-connection";
import {Table} from "./components/Table";
import type {FormInfo, MinimalFormInfo, Submission} from "./domain/types";
import {makePair} from "./Utilities";


import FormCreator from "./user/form-creator";
import {ViewForm, DisplayFrom} from "./user/view-form";
import {DisplaySubmissionData} from "./user/view-submission-data";
import {
    BaseFormComponent,
    FormIdInputComponent,
    KeyInputComponent,
    ShowFormComponent,
    SubUsersMain
} from "./sub-user/complete-form";
import {LoginComponent, RegisterComponent} from "./user/login";
import NavBar from "./components/NavBar/NavBar";
import {DistributeKeys} from "./user/distribute-keys";


const baseURL:string = configFile.baseURL;


interface DataProps {
    username:string
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
        <div style={props.gridStyle}>

            <div id="display" style={props.divStyle}>

                <h3 style={{
                    padding:'5px', textAlign:'center'
                }}>My Forms</h3>

                <Table<MinimalFormInfo> columns={["Name", "Date created", "Date published", "Date closed" , "Submissions"]}
                                 dataFields={['name',
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

    return(
        <div id="Continut" style={{display:'flex', alignItems:'center', height:'100%', justifyContent:'center'}}>

                {username !== ""?
                    <DataDisplay username={username}
                                 // div style reprezinta stilul div-urilor din fiecare celula a grid-ului
                        divStyle={{display:'flex', flexDirection:'column', alignItems:'stretch', padding:'10px',
                            flexGrow:'1', justifyContent:'start'}}

                        gridStyle={{display:'grid', gridTemplateColumns:'1fr', width:'70%', height:'100%', alignItems:'start',
                            gap:'10px'}} />
                    :
                    <NotLoggedInPanel divStyle={{display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'10px',
                            paddingBottom:'10px', height:'90%', flexGrow:'1', justifyContent:'center'}} />
                }

            </div>
    );
}

function Index() {

    const loc = useLocation();
    const nav = useNavigate();

    const queryClient = useQueryClient();
    const {isSuccess, data, isLoading, isError, isStale} = useQuery({queryKey: ['username'], queryFn:auto_login, retry:0})
    const username:string|null = useMemo(()=>data?data:null,[data]);

    React.useEffect(()=> {
        console.log(isSuccess, isError, isLoading, data)
            if(isError) {
                console.log(loc.pathname)
                if (!['/', '/login', '/register'].includes(loc.pathname))
                    nav('/');
            }
        },
        [isStale, isError]
    );

    return (

        <div id="Pagina intreaga"
            style={{display:"flex", flexDirection:"column", height:"100vh", minWidth:'300px', overflowY:"auto", alignItems:'stretch', overflowX:'hidden'}}>

            <NavBar isLoading={isLoading} isSuccess={isSuccess} username={username} queryClient={queryClient} />

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
                            <Route path={":formId"} element={<BaseFormComponent />}>
                                <Route index element={<KeyInputComponent />} ></Route>
                                <Route path={"complete"} element={<ShowFormComponent />} ></Route>
                            </Route>
                        </Route>
                        <Route path='/*' element={<Navigate to={'/'} replace={true} />} ></Route>
                    </Routes>
                </BrowserRouter>
            </AlertProvider>
        </QueryClientProvider>
    );
}

