// Folosita la rezolvarea request-urilor eșuate datorită lipsei de autentificare.
import {forEach} from "lodash";

interface Resolute {
    resolve: (val?: any) => void
    reject: () => void
}

// Incearca folosirea token-ului de refresh.
// Returneaza adevarat sau fals in functie de rezultat.
async function refresh(): Promise<boolean> {

    const refreshRequest = new Request(
        "/api/auth/refresh",
        {
            method: "POST",
            credentials: 'include'
        });

    const response = await window.fetch(refreshRequest)

    return response.ok
}

let isRefreshing = false
let failedResponses: Resolute[] = new Array<Resolute>()

// Functie ce inveleste metoda fetch al obiectului window. Permite operatiunea de refresh
// a token-urilor de acces.
export default async function fetch(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {

    let response: Response = await window.fetch(input, init) // Initial, facem apelul api
    if (response.status === 401) { // Daca utilizatorul nu este autentificat (sau are tokenul expirat/invalid)
        if (isRefreshing) { // Daca s-a trimis cerere de refresh a token-ului de acces

            // Creem un promise si retinem metodele de resolve si reject
            let {promise, resolve, reject} = Promise.withResolvers()

            // Metodele sunt memorate pentru a putea rezolva promise-ul mai tarziu
            failedResponses.push({resolve, reject})

            // Returnam promise-ul
            return promise.then(
                () => window.fetch(input, init), // Daca s-a dat refresh la tokenul de acces, reincercam apelul api
                () => response) // Daca nu s-a putut da refresh la token, se returneaza direct raspunsul initial
        }

        // Este primul apel fara autentificare, deci incercam sa folosim tokenul de refresh
        isRefreshing = true
        const refreshed = await refresh()

        forEach(failedResponses, ({resolve, reject}: Resolute) => {
            if (refreshed) resolve() // Daca token-ul a fost reimprospatat, se reincearca apelul api
            else reject()
        })

        failedResponses = []
        isRefreshing = false

        if (refreshed) return window.fetch(input, init) // Daca token-ul a fost reimprospatat, se reincearca apelul api

        // Altfel, returnam raspunsul asa cum e (nu avem ce face)
    }
    return response // Daca raspunsul este ok, il returnam
}