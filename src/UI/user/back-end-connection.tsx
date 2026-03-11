import config from '../config.json'

const url:string = config.baseURL;

export class LoginInfo {
    private _username;
    private _password;

    constructor(username:string, password:string) {
        this._username = username;
        this._password = password;

        Object.seal(this);
        Object.preventExtensions(this);
    }

    public get username() { return this._username; }
    public get password() { return this._password; }
}

export interface Item {
    name:string
    owner:string
    value:string
}

export async function getAccessToken(loginInfo:LoginInfo) {

    const loginForm = new FormData();
    loginForm.append("username", loginInfo.username)
    loginForm.append("password", loginInfo.password)

    return await fetch(url+"/users/token", {method:"POST", body:loginForm});
}

// functie pt login in urma introducerii credentialelor
export async function login(username:string, password:string){

    // initial citim datele introduse in formular
    const loginInfo:LoginInfo = new LoginInfo(username, password);

    if(loginInfo === null)
        return undefined;

    try {

        const tokenResponse:Response = await getAccessToken(new LoginInfo(loginInfo.username, loginInfo.password));

        if(tokenResponse.ok) {

            console.log(`Logged in as ${loginInfo.username}.`);
            alert(`Logged in succesfuly as ${loginInfo.username}. Returning to main page.`);
            window.location.replace(url);
        }
        else {
            const errorMsg = "Server responded with status: " + tokenResponse.status + ".\nReturned message: " + (await tokenResponse.json()).message;
            throw new Error(errorMsg);
        }
    }
    catch(error) {
        alert(error);
    }
}

export async function register(username:string, password:string) {

    try {

        const requestHeader = new Headers({
            'Accept': "application/json",
            'Content-Type': "application/json"
        });

        const request = new Request(url + "/users/register", {
            method: "PUT",
            headers: requestHeader,
            body: JSON.stringify({
                username: username,
                password: password,
                email: (username != undefined) ? password : undefined
            })
        });

        const response = await fetch(request);
        if (response.ok) {
            const data = await response.json();
            alert(data.message);
        } else {
            const data = await response.json();
            throw new Error("Server has responded with status: " + response.status
                + ".\nReturned message: " + data.message);
        }
    } catch (error: any) {
        alert(error.toString());
    }
}

// functie pt login automat, daca utilizatorul s-a logat anterior
export async function auto_login():Promise<string|undefined>{

    const loginRequest = new Request(
        url + "/users/me",
        {
            method:"POST",
            credentials:'include'
        });

    try {
        const loginResponse = await fetch(loginRequest);

        if(loginResponse.ok)
        {
            const data:any = await loginResponse.json();
            if(Object.hasOwn(data, 'username'))
                return data.username;
            else
                throw new Error("Autologin did not return a username.");

        }
        else {
            console.log("Could not login automatically.");
            return undefined;
        }
    }
    catch(error) {
        alert(error);
        return undefined;
    }
}

export async function get_items():Promise<Array<Item>|undefined> {
    try {

        const getItemsRequest = new Request(
            url+'/users/me/items',
            {
                method:'GET',
                credentials:'include'
            });

        const requestResponse = await fetch(getItemsRequest);
        if (requestResponse.ok) {

            const data = await requestResponse.json();
            if(Object.hasOwn(data, 'items'))
            {
                return data.items;
            }

            else
                throw new Error('Get items request did not return items.')
        }
    }
    catch (error) {
        alert(error);
        return undefined;
    }
}

export async function logout():Promise<boolean> {
    try {
        const logoutRequest = new Request(url+"/users/me/logout",
            {
                method:"POST",
                credentials:"include"
            });

        const logoutResponse = await fetch(logoutRequest);
        return logoutResponse.ok;

    }
    catch(error) {
        alert(error);
        return false;
    }
}

export async function add_item(username:string, item:Item):Promise<boolean> {
    try {

        const requestHeader = new Headers({
            'Accept': "application/json",
            'Content-Type': "application/json"
        });
        const createItemRequest = new Request(url+"/users/me/items",
            {
                method:"POST",
                headers:requestHeader,
                body:JSON.stringify(item)
            }
        )
        const createItemResponse = await fetch(createItemRequest);
        if(createItemResponse.ok) {
            return true;
        }
        const errorMsg:string = (await createItemResponse.json()).message;
        throw new Error(`Failed to create item. Returned message: ${errorMsg}`)
    }
    catch(Error) {
        alert(Error);
        return false;
    }

}

