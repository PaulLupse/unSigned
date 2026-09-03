import React, {StrictMode, useState} from 'react'
import {createRoot} from "react-dom/client";
import {BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {QueryCache, QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";
import {AlertProvider} from "./components/AlertProvider";


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
import {ListForms} from "./routes/user/ListForms";
import ThankYou from "./routes/sub-user/ThankYou";
import TemplatesMenu from "./routes/user/TemplatesMenu";
import {ListTemplates} from "./routes/user/ListTemplates";

import "./general.css"
import Loading from "src/components/Loading";
import {LoadingOverlayProvider} from "src/components/LoadingOverlayProvider";
import {GoogleOAuthProvider} from "@react-oauth/google";
import {AuthProvider, useAuth} from "src/components/AuthProvider";
import {getCurrentUserData} from "src/server/auth";
import {MeRedirect} from "src/components/MeRedirect";



function Index() {

    const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
    const {user, isLoading, isError, isSuccess} = useAuth()

    const loc = useLocation();
    const nav = useNavigate();

    return (
        
        <div id="Pagina intreaga"
            style={{

                display:'grid',
                gridTemplateRows:'100px 1fr',
                minHeight: '100dvh',
                minWidth:'320px',
            }}>

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
                queryClient={queryClient} />
            <main>
                {
                    isLoading?
                    <Loading /> : <Outlet />
                }
                <SideBar isOpen={sidebarIsOpen}
                         setIsOpen={setSidebarIsOpen}
                         anchor={'right'} />
            </main>
        </div>
    );
}

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError:(error)=>{
            if('status' in error) // daca eroarea este de tip CustomError . . .
                if(error.status == 401) {
                    // if (!['/me', '/login', '/register', '/'].includes(window.location.pathname))
                    //     window.location.pathname='/login'
                    return;
                }
        }
    })
});

function RoutingLayout () {

    const {user} = useAuth()

    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Index />}>
                    <Route index element={<Presentation />} />
                    <Route path='me/*' element={<MeRedirect user={user} />} />
                    <Route path='login' element={<LoginComponent />}/>
                    <Route path='register' element={<RegisterComponent />}/>
                    <Route path='form/create' element={<FormCreator />} />

                    <Route path='user/:username' >
                        <Route index element={<Profile />} />
                        <Route path='forms' element={<ListForms />} />
                        <Route path='templates' element={<ListTemplates type={'private'} />} />
                    </Route>

                    <Route path={'form/:formId'} element={<Form />}>
                        <Route path="view" element={<DisplayFrom />} />
                        <Route path="edit" element={<EditForm />} />
                        <Route path='submissions' element={<SubmissionData />} />
                        <Route path='keys' element={<DistributeKeys />}/>
                    </Route>

                    <Route path='template/:templateId' element={<Template />}>
                        <Route path="view" element={<DisplayTemplate />}/>
                        <Route path='edit' element={<EditTemplate />}/>
                    </Route>

                    <Route path='templates' >
                        <Route index element={<TemplatesMenu />} />
                        <Route path={"official"} element={<ListTemplates type={"official"} />} />
                        <Route path={"public"} element={<ListTemplates type={"public"} />}  />
                        <Route path={'create'} element={<TemplateCreator />}/>
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
    )
}

window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv);

    root.render(
        <StrictMode>
        <GoogleOAuthProvider clientId={"783786984384-n5hhnq51lruano07me2q82e3lp9lil2k.apps.googleusercontent.com"}>
        <QueryClientProvider client={queryClient} >
        <LoadingOverlayProvider>
        <AlertProvider>
        <StyledEngineProvider injectFirst={true}>
        <AuthProvider>

        <RoutingLayout />

        </AuthProvider>
        </StyledEngineProvider>
        </AlertProvider>
        </LoadingOverlayProvider>
        </QueryClientProvider>
        </GoogleOAuthProvider>
        </StrictMode>
    );
}

