import React, {useMemo, useState} from 'react'
import {createRoot} from "react-dom/client";
import {BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {QueryCache, QueryClient, QueryClientProvider, useQuery, useQueryClient} from "@tanstack/react-query";
import {AlertProvider} from "./components/AlertProvider";

import '../../static/css/general.css'

import {auto_login} from "./server/users-server";

import FormCreator from "./routes/user/FormCreator/FormCreator";
import {Form} from "./routes/user/Form";
import {DisplayFrom} from "./routes/user/DisplayForm/DisplayForm";
import {SubmissionData} from "./routes/user/SubmissionData/SubmissionData";
import
    SubUsersMain, {
    BaseComponent,
    FormIdInputComponent,
    KeyInputComponent,
    ShowFormComponent,
} from "./routes/sub-user/SubUsersMain";
import {StyledEngineProvider} from '@mui/material/styles';

import {LoginComponent, RegisterComponent} from "./routes/user/Auth";
import NavBar from "./components/NavBar/NavBar";
import {DistributeKeys} from "./routes/user/DistributeKeys/DistributeKeys";
import SideBar from "./components/SideBar/BetterSideBar";
import toast, {Toaster} from "react-hot-toast";
import {Profile} from "./routes/user/Profile/Profile";


import './routes/user/Presentation/Presentation.module.css'
import EditForm from "src/frontend/routes/user/EditForm/EditForm";
import Template from "src/frontend/routes/user/Template";
import DisplayTemplate from "src/frontend/routes/user/DisplayTemplate/DisplayTemplate";
import EditTemplate from "src/frontend/routes/user/EditTemplate/EditTemplate";
import {Presentation} from "src/frontend/routes/user/Presentation/Presentation";
import TemplateCreator from "src/frontend/routes/user/TemplateCreator/TemplateCreator";
import {DisplayTemplates, DisplayForms} from "src/frontend/routes/user/DisplayUserData";
import ThankYou from "src/frontend/routes/sub-user/ThankYou";
import type {User} from "src/frontend/domain/types";
import AdminMain from "src/frontend/routes/admin/AdminMain/AdminMain";

function Index() {

    const loc = useLocation();
    const nav = useNavigate();

    const queryClient = useQueryClient();
    const {isSuccess, data, isLoading, isError, isStale} = useQuery({queryKey: ['user'], queryFn:auto_login, retry:0, refetchOnWindowFocus:false})

    const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

    React.useEffect(()=> {
            if(isError) {
                if (!['/me', '/login', '/register', '/'].includes(loc.pathname))
                    nav('/me', {replace:true});
            }
        },[loc, isSuccess, isError, isStale, isLoading]
    );

    return (

        <div id="Pagina intreaga"
            style={{

                display:'grid',
                gridTemplateRows:'100px 1fr',
                minHeight: '100dvh',
                minWidth:'320px'}}>

            <Toaster position="top-center"
                toastOptions={{
                        style:{
                            borderRadius:'0',
                            border:'1px solid'
                        }
                    }
                }
            />

            <NavBar
                sidebarIsOpen={sidebarIsOpen}
                setSidebarIsOpen={setSidebarIsOpen}
                isLoading={isLoading}
                isSuccess={isSuccess}
                queryClient={queryClient} />
            <main>
                {
                    isLoading?
                    <div className={'loading'}>
                        <p>
                            Loading . . .
                        </p>
                    </div>:
                        <Outlet context={{user:data?data:undefined}}/>
                }
                <SideBar isOpen={sidebarIsOpen} setIsOpen={setSidebarIsOpen} anchor={'right'} />
            </main>


        </div>
    );
}

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError:(error)=>{
            if('status' in error) // daca eroarea este de tip CustomError . . .
                if(error.status == 401) {
                    if (!['/me', '/login', '/register', '/'].includes(window.location.pathname)) 
                        window.location.pathname='/login'
                    return;
                }
            toast.error(error.message);
        }
    })
});

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
                                <Route path='me' >
                                    <Route index element={<Profile />} />
                                    <Route path='forms' element={<DisplayForms />} />
                                    <Route path='templates' element={<DisplayTemplates />} />
                                </Route>
                                <Route path='login' element={<LoginComponent />}/>
                                <Route path='register' element={<RegisterComponent />}/>
                                <Route path='form/create' element={<FormCreator />} />
                                <Route path='template/create' element={<TemplateCreator />} />
                                <Route path={'form/:formId'} element={<Form />}>
                                    <Route path="view" element={<DisplayFrom />} />
                                    <Route path="edit" element={<EditForm />} />
                                    <Route path='submissions' element={<SubmissionData />} />
                                    <Route path='keys' element={<DistributeKeys />}/>
                                </Route>
                                <Route path={'template/:templateId'} element={<Template />}>
                                    <Route path="view" element={<DisplayTemplate />}/>
                                    <Route path='edit' element={<EditTemplate />}/>
                                </Route>
                                <Route path={"admin"} element={<AdminMain />}>

                                </Route>
                            </Route>
                            {/* ruta /complete-form este separata de ruta principala deoarece este menita sa fie accesata de sub-utilizatori */}
                            <Route path='complete-form' element={<SubUsersMain />}>
                                <Route index element={<FormIdInputComponent />}></Route>
                                <Route path={":formId"} element={<BaseComponent />}>
                                    <Route index element={<KeyInputComponent />} ></Route>
                                    <Route path={"complete"} element={<ShowFormComponent />} ></Route>
                                    <Route path={"done"} element={<ThankYou />}></Route>
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

