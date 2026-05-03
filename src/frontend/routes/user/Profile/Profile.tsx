import {Link, useNavigate, useOutletContext} from "react-router-dom";
import React from "react";
import {get_forms, get_templates, logout} from "src/frontend/server/users-server";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import * as style from './Profile.module.css'
import type {User} from "src/frontend/domain/types";
import toast from "react-hot-toast";
import {NavButton} from "src/frontend/components/Buttons/Buttons";


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

    const getForms = useQuery({
        queryFn:get_forms,
        queryKey:['forms'],
        retry:0
    })

    const getTemplates = useQuery({
        queryFn:async()=>get_templates({type:'mine'}),
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
                <hr style={{border:'1px solid gray', width:'100%', boxSizing:'border-box'}}/>
                <div className={style.content}>
                    <p>User id:</p> <p>{user.id}</p>
                    <p>Forms:</p> <p>{getForms.data?.length}</p>
                    <p>Templates:</p> <p>{getTemplates.data?.length}</p>
                </div>
                <hr style={{border:'1px solid gray', width:'100%', boxSizing:'border-box'}}/>
                <div className={style.footer}>
                    <NavButton to={'/me/forms'}>My forms</NavButton>
                    <NavButton to={'/templates/mine'}>My templates</NavButton>
                </div>
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