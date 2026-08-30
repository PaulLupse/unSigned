import React, {useMemo, useState} from 'react'
import {createRoot} from "react-dom/client";
import {BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {QueryCache, QueryClient, QueryClientProvider, useQuery, useQueryClient} from "@tanstack/react-query";
import {AlertProvider} from "./components/AlertProvider";

import {getUserData} from "./server/auth";

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

import {LoginComponent, RegisterComponent} from "./routes/user/Auth/Auth";
import NavBar from "./components/NavBar/NavBar";
import {DistributeKeys} from "./routes/user/DistributeKeys/DistributeKeys";
import SideBar from "./components/SideBar/BetterSideBar";
import toast, {Toaster} from "react-hot-toast";
import {Profile} from "./routes/user/Profile/Profile";


import './routes/user/Presentation/Presentation.module.css'
import EditForm from "./routes/user/EditForm/EditForm";
import Template from "./routes/user/Template";
import DisplayTemplate from "./routes/user/DisplayTemplate/DisplayTemplate";
import EditTemplate from "./routes/user/EditTemplate/EditTemplate";
import {Presentation} from "./routes/user/Presentation/Presentation";
import TemplateCreator from "./routes/user/TemplateCreator/TemplateCreator";
import {DisplayForms} from "./routes/user/DisplayForms";
import ThankYou from "./routes/sub-user/ThankYou";
import TemplatesMenu from "./routes/user/TemplatesMenu";
import {ListTemplates} from "./routes/user/ListTemplates";

import "./general.css"
import Loading from "src/components/Loading";
import {LoadingOverlayProvider} from "src/components/LoadingOverlayProvider";
import {GoogleOAuthProvider} from "@react-oauth/google";



function Index() {

    const loc = useLocation();
    const nav = useNavigate();

    const queryClient = useQueryClient();
    const {isSuccess, data, isLoading, isError, isStale} = useQuery(
        {queryKey: ['user'], 
        queryFn:getUserData,
        retry:0,
        refetchOnWindowFocus:false})

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
                    <Loading /> : <Outlet context={{user:data?data:undefined}}/>
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
        <GoogleOAuthProvider clientId={"783786984384-n5hhnq51lruano07me2q82e3lp9lil2k.apps.googleusercontent.com"}>
        <QueryClientProvider client={queryClient} >
        <LoadingOverlayProvider>
        <AlertProvider>
        <StyledEngineProvider injectFirst={true}>
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Index />}>
                    <Route index element={<Presentation />} />
                    <Route path='me' >
                        <Route index element={<Profile />} />
                        <Route path='forms' element={<DisplayForms />} />
                        <Route path={'forms/:formId'} element={<Form />}>
                            <Route path="view" element={<DisplayFrom />} />
                            <Route path="edit" element={<EditForm />} />
                            <Route path='submissions' element={<SubmissionData />} />
                            <Route path='keys' element={<DistributeKeys />}/>
                        </Route>
                    </Route>
                    <Route path='login' element={<LoginComponent />}/>
                    <Route path='register' element={<RegisterComponent />}/>
                    <Route path='form/create' element={<FormCreator />} />
                    <Route path='templates' >
                        <Route index element={<TemplatesMenu />} />
                        <Route path={"official"} element={<ListTemplates/>} />
                        <Route path={"private"} element={<ListTemplates/>}  />
                        <Route path={"public"} element={<ListTemplates/>}  />
                        <Route path={'create'} element={<TemplateCreator />}/>
                        <Route path={'create/official'} element={<TemplateCreator />}/>
                        <Route path={':templateId'} element={<Template />}>
                            <Route path="view" element={<DisplayTemplate />}/>
                            <Route path='edit' element={<EditTemplate />}/>
                        </Route>
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
        </LoadingOverlayProvider>
        </QueryClientProvider>
        </GoogleOAuthProvider>
    );
}

