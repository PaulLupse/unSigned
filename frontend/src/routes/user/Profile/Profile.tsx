import {Link, useNavigate, useOutletContext, useParams} from "react-router-dom";
import React, {use, useEffect, useMemo, useState} from "react";
import {getForms, getTemplates, getUserData, getUserDataAndStats} from "src/server/users-server";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {User, UserStats} from "src/domain/types";
import toast from "react-hot-toast";
import {NavButton} from "src/components/Buttons/Buttons";
import {useAlert} from "src/components/AlertProvider";

import * as style from './Profile.module.css'
import {deleteUser, logoutUser} from "src/server/auth";
import Loading from "src/components/Loading";
import {useAuth} from "src/components/AuthProvider";


function ProfileEntry ({text, value}:{text:string, value:string}) {
    return (
        <div className={style.profileEntry}>
            <p>{text}</p>
            <p>{value}</p>
        </div>
    )
}

function Divider() {
    return (
        <hr className={style.sectionDivider} />
    )
}


function useLogout () {

    const queryClient = useQueryClient()

    const {mutate} = useMutation({
        mutationFn:logoutUser,
        onSuccess:async()=>{

            toast.success("Logged out successfully!")

            await queryClient.resetQueries({queryKey:['currentUser']})

            console.log(queryClient.getQueryData(['currentUser']))
        },
        onError:(error)=>{
            toast.error(error.message)
        }
    })

    return mutate
}

function useDeleteUser() {

    const queryClient = useQueryClient()
    const nav = useNavigate()


    const {mutate} = useMutation({
        mutationFn:deleteUser,
        onSuccess:async ()=>{
            toast.success("Deleted user successfully!")

            await queryClient.resetQueries({queryKey:['user']})
            await queryClient.resetQueries({queryKey:['currentUser']})

            nav('/')
        },
        onError:(error)=>{
            toast.error(error.message)
        }
    })

    return mutate
}


function ProfileDataDisplay({user, stats}:{user:User, stats:UserStats}) {

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const {showAlert} = useAlert()

    const currentUser = useAuth()
    const logout = useLogout()
    const deleteUser = useDeleteUser()

    const canEdit = currentUser.user?.id === user.id

    const deleteAccount = async () => {
        showAlert("Are you sure? This action cannot be undone.",
            [
                {
                    text:"Yes",
                    action:()=>deleteUser({userId:user.id})
                },
                {
                    text:"No"
                }
            ]
        )
    }

    return(
        <div className={style.main}>
            <div className={style.profileCard}>
                <div className={style.header}>
                    <img className={style.pfp} src='/images/account.png' alt={'pfp'}/>
                    <h2>{user.username}</h2>

                    {
                        canEdit &&
                        <button onClick={()=>{
                            console.log(queryClient.getQueryData(['currentUser']))
                            logout()
                        }}>
                            Log out
                        </button>
                    }

                </div>
                <Divider />
                <div className={style.content}>
                    <ProfileEntry text={'ID'} value={user.id} />
                    <ProfileEntry text={'Email'} value={user.email}  />
                    <ProfileEntry text={'Forms'} value={stats.formCount.toString()}  />
                    <ProfileEntry text={'Templates'} value={stats.templateCount.toString()}  />
                </div>
                {
                    canEdit &&
                    <>
                        <Divider />
                        <div className={style.footer}>
                            <NavButton to={'forms'}>My forms</NavButton>
                            <NavButton to={'templates'}>My templates</NavButton>
                        </div>
                        <Divider />
                        <button onClick={deleteAccount}>
                            Delete account
                        </button>
                    </>
                }

            </div>
        </div>

    );
}

export function Profile() {

    const params = useParams();
    const username:string|undefined = params.username

    const {data, isLoading, isError, error} = useQuery({
        queryFn:async()=>{
            if (username)
                return await getUserDataAndStats({username:username})
            return undefined
        },
        queryKey:['user'],
        retry:0,
        refetchOnWindowFocus:false
    })

    if(isLoading) return <Loading />
    else if(isError || data===undefined) return (
        <h2>
            {error?.message}
        </h2>
    )
    else return <ProfileDataDisplay user={data.user}
                             stats={data.stats} />
}