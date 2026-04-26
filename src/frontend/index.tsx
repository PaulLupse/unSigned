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

import {auto_login} from "./routes/user/back-end-connection";

import FormCreator from "./routes/user/FormCreator/FormCreator";
import {ViewForm} from "./routes/user/ViewForm";
import {DisplayFrom} from "./routes/user/DisplayForm/DisplayForm";
import {DisplaySubmissionData} from "./routes/user/view-submission-data";
import {
    BaseComponent,
    FormIdInputComponent,
    KeyInputComponent,
    ShowFormComponent,
    SubUsersMain
} from "./routes/sub-user/complete-form";
import { StyledEngineProvider } from '@mui/material/styles';

import {LoginComponent, RegisterComponent} from "./routes/user/login";
import NavBar from "./components/NavBar/NavBar";
import {DistributeKeys} from "./routes/user/distribute-keys";
import SideBar from "./components/SideBar/BetterSideBar";
import {Toaster} from "react-hot-toast";
import {Profile} from "./routes/user/profile";


import './Presentation.css'
function Presentation() {

    return(
        <div className={"presentation"}>
            <div className={"card"}>
                <h1>
                    unSigned
                </h1>
                <label>
                    Anonymous forms
                </label>
                <div>
                    <div>
                        <hr />
                        Key based
                        <hr />
                    </div>
                    <div>
                        <hr />
                        Stateless
                        <hr />
                    </div>
                    <div>
                        <hr />
                        Performant
                        <hr />
                    </div>
                </div>

            </div>
        </div>
    )
}

function Index() {

    const loc = useLocation();
    const nav = useNavigate();

    const queryClient = useQueryClient();
    const {isSuccess, data, isLoading, isError, isStale} = useQuery({queryKey: ['username'], queryFn:auto_login, retry:0, refetchOnWindowFocus:true, staleTime:3600})
    const username:string|null = useMemo(()=>data?data:null,[data, isSuccess, isStale, isError]);

    const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

    React.useEffect(()=> {
        console.log('SIA DAT QUERYYYYYYYYYYYYYYY');
            if(isError) {
                if (!['/me', '/login', '/register'].includes(loc.pathname))
                    nav('/me');
            }
        },
        [isStale, isError, isLoading]
    );

    return (

        <div id="Pagina intreaga"
            style={{

                display:'grid',
                gridTemplateRows:'100px 1fr',
                minHeight: '100dvh',
                minWidth:'320px'}}>

            <Toaster position="top-center" />

            <NavBar
                sidebarIsOpen={sidebarIsOpen}
                setSidebarIsOpen={setSidebarIsOpen}
                isLoading={isLoading}
                isSuccess={isSuccess}
                username={username}
                queryClient={queryClient} />
            <div style={{}}>
                {
                    isLoading?
                    <div style={{display:"grid", placeContent:"center"}}>
                        <p>
                            Loading . . .
                        </p>
                    </div>:
                        <Outlet  context={{username:isSuccess?username:""}}/>
                }
                <SideBar isOpen={sidebarIsOpen} setIsOpen={setSidebarIsOpen} anchor={'right'} />
            </div>


        </div>
    );
}

const queryClient = new QueryClient();
window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv);

    root.render(
        <QueryClientProvider client={queryClient} >
            <AlertProvider>
                <StyledEngineProvider injectFirst={true}>
                    <BrowserRouter>
                        <Routes>
                            <Route path='/' element={<Index />}>
                                <Route index element={<Presentation />} />
                                <Route path='me' element={<Profile />} />
                                <Route path='login' element={<LoginComponent />}/>
                                <Route path='register' element={<RegisterComponent />}/>
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

