import React, {use} from 'react'
import {createRoot} from "react-dom/client";
import configFile from './config.json'

import {auto_login, get_items, logout} from "./user/back-end-connection";

import {Table} from "./components/Table";

import type {Item} from "./user/back-end-connection";

import {BrowserRouter, useNavigate, Route} from "react-router-dom"

const baseURL:string = configFile.baseURL;

interface DataProps {
    username:string
    isLoggedIn:boolean
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

    const [itemList, setItemList] = React.useState(Array<Item>);

    const navigate = useNavigate();

    React.useEffect(()=> {
                    async function getItems ():Promise<void> {
                        const newItems:Array<Item>|undefined = await get_items();

                        if(newItems) {
                            console.log(newItems);
                            setItemList(newItems);
                        }
                    }
                    if(props.isLoggedIn)
                        getItems();
                },
                [props.isLoggedIn]
            );

    return(
        // folosim un grid pentru a aseza sectiunile din continut
        // o sectiune va fii dedicata vizualizarea chestionarelor create de utilizator
        <div style={props.gridStyle}>

            <div id="display" style={props.divStyle}>

                <h3 style={{padding:'5px'}}>My Items</h3>

                <Table<Item> columns={["Name", "Value"]} data={itemList} />
                <div style={{display:"flex", flexDirection:'column'}}>
                    <button className={"table-button"}
                        onClick={
                            () => {
                                navigate('/create-new-item');
                                navigate(0);
                            }
                        }>
                        New Item
                    </button>
                </div>
            </div>
        </div>

    );
}

function Main() {

    const [username, setUsername] = React.useState('');
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    // folosim un effect pentru a returna utilizatorul curent
    React.useEffect(()=> {
            async function getUser ():Promise<void> {
                const username:string|undefined = await auto_login();
                if(username) {
                    setUsername(username);
                    setIsLoggedIn(true);
                }
            }
            getUser();
        },
        []
    );

    return (
        <div id="Pagina intreaga"
            style={{display:"flex", flexDirection:"column", height:'100vh', minWidth:'300px', alignItems:'stretch',
            gap:'10px'}}>

            <div id="Bara de sus"
                style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
                borderBottom:'5px', borderBottomStyle:'double'}}>

                <div style={{display:"flex", alignItems:'center', gap:'10px', marginLeft:'10px'}}>
                    <p style={{textAlign:'center'}}>
                        Current user: {isLoggedIn?username:'none'}
                    </p>
                    {
                        isLoggedIn &&
                        <button
                            onClick={
                                async()=> {
                                    if (await logout()) {
                                        setUsername('');
                                        setIsLoggedIn(false);
                                    }
                                }
                            }
                        >
                            Log out
                        </button>
                    }
                </div>

                <div style={{flexGrow:'1'}}>
                    <h1 style={{textAlign:'center'}}>
                        Main Page
                    </h1>
                </div>

            </div>

            <div id="Continut" style={{display:'flex', alignItems:'center', height:'100%', justifyContent:'center'}}>

                {isLoggedIn?
                    <DataDisplay username={username} isLoggedIn={isLoggedIn}
                                 // div style reprezinta stilul div-urilor din fiecare celula a grid-ului
                        divStyle={{display:'flex', flexDirection:'column', alignItems:'stretch', padding:'10px',
                            flexGrow:'1', justifyContent:'start', borderStyle:'dotted', overflow:'auto'}}

                        gridStyle={{display:'grid', gridTemplateColumns:'1fr', width:'90%', height:'100%', alignItems:'start',
                            gap:'10px'}} />
                    :
                    <NotLoggedInPanel divStyle={{display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'10px',
                            paddingBottom:'10px', height:'90%', flexGrow:'1', justifyContent:'center'}} />
                }

            </div>


        </div>
    );
}

window.onload = ()=>{
    const rootDiv:HTMLDivElement = document.getElementById("root") as HTMLDivElement
    const root = createRoot(rootDiv);
    root.render(
        <BrowserRouter>

            <Main />
        </BrowserRouter>);
}