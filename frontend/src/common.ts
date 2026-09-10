// Obiecte/constante folosite de mai multe script-uri

export const REQUEST_WITH_PAYLOAD_HEADERS = new Headers({
        'Accept': "application/json",
        'Content-Type': "application/json"
    });


export const BAD_USER_DATA_ERR = Error("Bad user data coming from server")