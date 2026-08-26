import React from "react";
import {CircularProgress} from "@mui/material";

export default function Loading() {
    return (
        <div className={'loading'}>
            <CircularProgress color={'black'} />
        </div>
    )
}