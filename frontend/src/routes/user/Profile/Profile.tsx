import {Link, useNavigate, useOutletContext} from "react-router-dom";
import React from "react";
import {deleteUser, getForms, getTemplates, logout} from "src/server/users-server";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {User} from "src/domain/types";
import toast from "react-hot-toast";
import {NavButton} from "src/components/Buttons/Buttons";
import {useAlert} from "src/components/AlertProvider";

import * as style from './Profile.module.css'

function NotLoggedInPanel() {
    return (
        <div className={style.notLoggedInPanel}>
            <h3>
                You are not logged in.
            </h3>
            <Link to={'/login'}>Login</Link>
            <Link to={'/register'}>Register</Link>
        </div>
    )
}

function DataDisplay({user}:{user:User}) {

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const {showAlert} = useAlert()


    const deleteMutation = useMutation({
        mutationFn:deleteUser,
        onSuccess:()=>{
            toast.success("Accout deleted");
            queryClient.removeQueries({queryKey:['user']})
            navigate('/', {replace:true});
        },
        onError:(error)=>{toast.error(error.message)}
    })

    const deleteAccount = async () => {
        showAlert("Are you sure? This action cannot be undone.",
            [
                {
                    text:"Yes",
                    action:deleteMutation.mutate
                },
                {
                    text:"No"
                }
            ]
        )
    }

    const getUserForms = useQuery({
        queryFn:getForms,
        queryKey:['forms'],
        retry:0
    })

    const getUserTemplates = useQuery({
        queryFn:async()=>getTemplates({type:'mine'}),
        queryKey:['templates'],
        retry:0
    })

    const logoutMutation = useMutation({
        mutationFn:logout,
        onSuccess:async()=>{
            toast.success("Logged out successfully!")
            queryClient.removeQueries({queryKey:['user']})
            navigate('/', {replace:true});
        },
        onError:(error)=>{
            toast.error(error.message)
        }
    })

    const logoutUser = ()=>{logoutMutation.mutate()}

    return(
        <div className={style.main}>
            <div className={style.profileCard}>
                <div className={style.header}>
                    <img className={style.pfp} src='/images/account.png' alt={'pfp'}/>
                    <h2>{user.username}</h2>
                    <button onClick={logoutUser}>Log out</button>
                </div>
                <hr className={style.line} />
                <div className={style.content}>
                    <p>User id:</p> <p>{user.id}</p>
                    <p>Email:</p> <p>{user.email}</p>
                    <p>Forms:</p> <p>{getUserForms.data?.length}</p>
                    <p>Templates:</p> <p>{getUserTemplates.data?.length}</p>
                </div>
                <hr className={style.line} />
                <div className={style.footer}>
                    <NavButton to={'/me/forms'}>My forms</NavButton>
                    <NavButton to={'/templates/mine'}>My templates</NavButton>
                </div>
                <hr className={style.line} />
                <button onClick={deleteAccount}>
                    Delete account
                </button>
            </div>
        </div>

    );
}

export function Profile() {

    const {user}:{user:User|undefined} = useOutletContext();
    return(
        user?
        <DataDisplay user={user} />
        :
        <NotLoggedInPanel />
    );
}