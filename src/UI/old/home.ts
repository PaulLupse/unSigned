import { SimpleTypeError } from "./utilities";
import { LoginInfo } from "./login";

class ItemInfo {
    
    private _name:string;
    private _owner:string;
    private _value:string;

    constructor(itemName:string, itemOwner:string, itemValue:string) {
        this._name = itemName;
        this._owner = itemOwner;
        this._value = itemValue;

        Object.seal(this);
        Object.preventExtensions(this);
    }
    
    public get name() { return this._name; }
    public get owner() { return this._owner; }
    public get value() { return this._value; }
}

const DOMAIN_URL:string = "http://127.0.0.1:8000";

// functie pt login la accesarea paginii, returneaza numele utilizatorului curent
async function auto_login() {

    const loginRequest = new Request(
        DOMAIN_URL + "/users/me",
        {
            method:"POST",
            credentials:'include'
        })

    try {
        const loginResponse = await fetch(loginRequest);
        const data = await loginResponse.json();

        if(loginResponse.ok) {
            const loginInfo:LoginInfo = new LoginInfo(data.username, "");
            return data;
        }
        else {
            const errorMsg:string = "Could not login. Please login manually.";
            throw new Error(errorMsg);
        }
    }
    catch(error) {
        return null;
    }
}

// functie de logout
async function logout() {

    try {

        const logoutResponse = await fetch(DOMAIN_URL+"/users/me/logout", {method:"POST"});
        if(logoutResponse.ok) {
            alert("Logged out succesfuly.");
        }
        else alert("Bruh");
    }
    catch (error) {
        alert(error);
    }
    
}

async function changeUserDisplay(loginDisplayId:string, username:string|null) {

    try {
        const loginDisplay:HTMLParagraphElement|null = <HTMLParagraphElement>document.getElementById(loginDisplayId);

        if(loginDisplay !== null) {
            if(username===null)
                loginDisplay.innerText = "Not logged in."
            else loginDisplay.innerText = `Logged in as ${username}`;
        }
    }
    catch(error:any) {
        alert(error);
    }

}

async function deleteAccount() {
    try {
        const deleteResponse = await fetch(DOMAIN_URL+"/users/me/delete", {method:"POST"});

        if(deleteResponse.ok) {
            alert("Acoount deleted succesfuly.");
        }
    }
    catch(error:any) {
        alert(error);
    }
}

async function toggleElementVisibility(buttonIdArray:string[]) {

    for(const buttonId of buttonIdArray) {
        const button:HTMLButtonElement = <HTMLButtonElement>document.getElementById(buttonId);
        if(button) {
            if(button.style.display == "none") 
                button.style.display = "block";
            else 
                button.style.display = "none";
        }
        else alert("Element not found.");
    }
}

async function getItemInfo(nameInputId:string, valueInputId:string, username:string):Promise<ItemInfo> {
    
    const nameInput:HTMLInputElement = <HTMLInputElement> document.getElementById(nameInputId);
    const valueInput:HTMLInputElement = <HTMLInputElement> document.getElementById(valueInputId);

    return new ItemInfo(nameInput.value, username, valueInput.value);
}

async function createItem(nameInputId:string, valueInputId:string) {

    try {
        const username:string|null = localStorage.getItem("user");
        if(username) {
            const itemInfo:ItemInfo = await getItemInfo(nameInputId, valueInputId, username);
            const createItemResponse:Response = await fetch(DOMAIN_URL+"/users/me/addItem",
                {
                    method:"POST",
                    body: JSON.stringify({
                        name: itemInfo.name,
                        owner: itemInfo.owner,
                        value: itemInfo.value
                    }),
                    headers: {
                        "Content-Type":"application/json"
                    }
                }
            )

            if(createItemResponse.ok) {
                alert("Item created successfully.");
            }
            else {
                const errorMsg = "Server responded with status: " + createItemResponse.status + ".\nReturned message: " + (await createItemResponse.json()).message;
                throw new Error(errorMsg);
            }
        }
        else throw Error("Could not find username in local storage.")
    }
    catch(error) {
        alert(error);
        return error;
    }
}

function clearTable(table:HTMLTableElement) {
    let rowNumber:number = table.rows.length;
    while(rowNumber > 1) {
        table.deleteRow(1);
        rowNumber --;
    }
}

function insertItem(table:HTMLTableElement, item:ItemInfo) {
    const newRow:HTMLTableRowElement = table.insertRow();
    const nameCell:HTMLTableCellElement = newRow.insertCell();
    const valueCell:HTMLTableCellElement = newRow.insertCell();

    nameCell.innerText = item.name;
    valueCell.innerText = item.value;
}

async function refreshItemTable(itemTableId:string) {
    
    try {

        const itemTable:HTMLTableElement = <HTMLTableElement>document.getElementById(itemTableId);

        if(itemTable === null)
            throw new Error("Table not found.");

        const getItemsResponse:Response = await fetch(DOMAIN_URL+"/users/me/items", {method:"GET"});
        const responseData:any = await getItemsResponse.json();

        if(getItemsResponse.ok) {
            clearTable(itemTable);
            const itemArray:Array<ItemInfo> = responseData.items;
            for(const item of itemArray) {
                insertItem(itemTable, item);
                // console.log(item);
            }
        }



    }
    catch(error) {
        alert(error);
        return error;
    }
}

window.onload = async function() {

    const user:LoginInfo = await auto_login();

    const currentUserDisplayID:string = "current_user_display";

    const deleteAccountButton:any = document.getElementById("delete_account_button");
    const logoutButton:any = document.getElementById("logout_button");

    const showAddItemFrameButton:any = document.getElementById("show_add_item_frame_button");
    const displayItemsFrameButton:any = document.getElementById("display_items_frame_button");
    const hideDisplayButton:any = document.getElementById("hide_display_button");

    const addItemButton:any = document.getElementById("add_item_button");


    try {
        localStorage.removeItem("user");
    }
    catch(err:any) {
        console.log("No username in storage.")
    }

    addItemButton.addEventListener("click",
        async()=> {
            await createItem("name_input", "value_input");
            toggleElementVisibility(["add_item_frame", "show_add_item_frame_button"]);
            refreshItemTable("items_table");
        });


    showAddItemFrameButton.addEventListener("click",
        ()=>toggleElementVisibility(["add_item_frame", "show_add_item_frame_button"])
    );

    displayItemsFrameButton.addEventListener("click",
        ()=>toggleElementVisibility(["display_items_frame", "display_items_frame_button"])
    )

    hideDisplayButton.addEventListener("click",
        ()=>toggleElementVisibility(["display_items_frame", "display_items_frame_button"])
    )


    logoutButton.addEventListener("click", 
        async ()=>{ 
            await logout()
            .then(()=>{
                changeUserDisplay(currentUserDisplayID, null);
                toggleElementVisibility(["user_logged_in_frame"]);
            });
            
        });

    deleteAccountButton.addEventListener("click", 
        async ()=>{
            await deleteAccount()
            .then(()=>{
                changeUserDisplay(currentUserDisplayID, null);
                toggleElementVisibility(["user_logged_in_frame"]);
            })
        }
    )

    if(user) {
        changeUserDisplay(currentUserDisplayID, user.username);
        toggleElementVisibility(["user_logged_in_frame"]);
        localStorage.setItem("user", user.username);
        refreshItemTable("items_table");
    }
}

