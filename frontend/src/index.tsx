import React, {StrictMode, useState} from 'react'
import {createRoot} from "react-dom/client";
import {BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {QueryCache, QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {AlertProvider} from "src/components/providers/AlertProvider";


import FormCreator from "src/views/user/FormCreator/FormCreator";
import {FormComponent} from "src/views/user/FormComponent";
import {DisplayFrom} from "src/views/user/DisplayForm/DisplayForm";
import {SubmissionData} from "src/views/user/SubmissionData/SubmissionData";
import
    SubUsersMain, {
    BaseComponent,
    FormIdInputComponent,
    KeyInputComponent,
    ShowFormComponent,
} from "src/views/sub-user/SubUsersMain";

import NavBar from "src/components/NavBar";
import {DistributeKeys} from "src/views/user/DistributeKeys/DistributeKeys";
import toast from "src/utilities/toast";
import {Profile} from "src/views/user/Profile/Profile";


import './views/user/Presentation/Presentation.module.css'
import EditForm from "src/views/user/EditForm/EditForm";
import TemplateComponent from "src/views/user/TemplateComponent";
import DisplayTemplate from "src/views/user/DisplayTemplate/DisplayTemplate";
import EditTemplate from "src/views/user/EditTemplate/EditTemplate";
import {Presentation} from "src/views/user/Presentation/Presentation";
import TemplateCreator from "src/views/user/TemplateCreator/TemplateCreator";
import {ListForms} from "src/views/user/ListForms";
import ThankYou from "src/views/sub-user/ThankYou";
import TemplatesMenu from "src/views/user/TemplatesMenu";
import {ListTemplates} from "src/views/user/ListTemplates";

import "src/index.css"
import Loading, {LoadingOverlayProvider} from "src/components/Loading";
import {GoogleOAuthProvider} from "@react-oauth/google";
import {AuthProvider, useAuth} from "src/components/providers/AuthProvider";
import {MeRedirect} from "src/components/utilities/MeRedirect";
import {TemplateType} from "src/client/types.gen";
import {SidebarProvider} from "src/components/ui/sidebar";
import {Sidebar} from "src/components/Sidebar";
import {Toaster} from "src/components/ui/toast";
import {Button} from "src/components/ui/button";
import {CustomError} from "src/utilities";
import {DialogProvider, useDialog} from "src/components/MessageDialog";
import NotFound from "src/views/common/NotFound";
import LoginView from "src/views/common/LoginView";



function Index() {

    const {user, isLoading, isError, isSuccess} = useAuth()
    const {showDialog} = useDialog();

    return (
        
        <div id="the-whole-page"
             className="grid grid-rows-[auto_1fr] min-h-dvh">

            <Toaster />
            <NavBar />
            <main id="main-content-wrapper" className="relative overflow-x-hidden">
                <div id="main-content" className="mx-auto h-full w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError:(error:Error|CustomError)=>{

            // Dacă eroarea ține de autentificare, nu se afișează mesajul de eroare
            if (error instanceof CustomError && error.status == 401)
                return

            toast.error(error.message)
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
                    <Route path='login' element={<LoginView />}/>
                    <Route path='register' element={<LoginView />}/>
                    <Route path='form/create' element={<FormCreator />} />

                    <Route path='user/:username' >
                        <Route index element={<Profile />} />
                        <Route path='forms' element={<ListForms />} />
                        <Route path='templates' element={<ListTemplates type={TemplateType.PRIVATE} />} />
                    </Route>

                    <Route path={'form/:formId'} element={<FormComponent />}>
                        <Route path="view" element={<DisplayFrom />} />
                        <Route path="edit" element={<EditForm />} />
                        <Route path='submissions' element={<SubmissionData />} />
                        <Route path='keys' element={<DistributeKeys />}/>
                    </Route>

                    <Route path='template/:templateId' element={<TemplateComponent />}>
                        <Route path="view" element={<DisplayTemplate />}/>
                        <Route path='edit' element={<EditTemplate />}/>
                    </Route>

                    <Route path='templates' >
                        <Route index element={<TemplatesMenu />} />
                        <Route path={"official"} element={<ListTemplates type={TemplateType.OFFICIAL} />} />
                        <Route path={"public"} element={<ListTemplates type={TemplateType.PUBLIC} />}  />
                        <Route path={'create'} element={<TemplateCreator />}/>
                    </Route>

                    <Route path="/404" element={<NotFound />} />

                {/* ruta /complete-form este separata de ruta principala deoarece este menita sa fie accesata de sub-utilizatori */}
                <Route path='complete-form' element={<SubUsersMain />}>
                    <Route index element={<FormIdInputComponent />}></Route>
                    <Route path={":formId"} element={<BaseComponent />}>
                        <Route index element={<KeyInputComponent />} ></Route>
                        <Route path={"complete"} element={<ShowFormComponent />} ></Route>
                        <Route path={"done"} element={<ThankYou />}></Route>
                    </Route>
                </Route>
                </Route>
                <Route path='/*' element={<Navigate to={'/404'} replace={true} />} ></Route>
            </Routes>
        </BrowserRouter>
    )
}

window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv)

    root.render(
        <StrictMode>
        <GoogleOAuthProvider clientId={"783786984384-n5hhnq51lruano07me2q82e3lp9lil2k.apps.googleusercontent.com"}>
        <QueryClientProvider client={queryClient} >
        <LoadingOverlayProvider>
        <AlertProvider>
        <AuthProvider>
        <DialogProvider>
        <SidebarProvider className="contents" defaultOpen={false}>
        <RoutingLayout />
        </SidebarProvider>
        </DialogProvider>
        </AuthProvider>
        </AlertProvider>
        </LoadingOverlayProvider>
        </QueryClientProvider>
        </GoogleOAuthProvider>
        </StrictMode>
    );
}

