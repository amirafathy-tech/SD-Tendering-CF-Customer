export class AuthUser {
    constructor(
        public email: string,
        private _token: string,
       // public role:[],
    ) { }

    get token() {
        return this._token;
    }
}