import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject, of } from 'rxjs';
import { AuthUser } from './auth-user.model';
import { environment } from '../../environments/environment';

export interface AuthResponseBackend {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private clientID = environment.clientID
  private clientSecret = environment.clientSecret

  
  private authUrl = "https://proxy-server.cfapps.eu10-004.hana.ondemand.com/auth"
  private registerUrl = "https://proxy-server.cfapps.eu10-004.hana.ondemand.com/api/iasusers"

  loggedInUser = new BehaviorSubject<AuthUser | null>(null);
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient, private router: Router) { }

  signUp(value: string, familyName: string, givenName: string, userName: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const data = {
      'value': value,
      'familyName': familyName,
      'givenName': givenName,
      'userName': userName
    }
    const config = {
      maxBodyLength: Infinity,
      headers,
      body: JSON.stringify(data)
    };
    console.log(data)
   return this.http
      .post<any>(
        this.registerUrl,
        data, { headers }
      )
  }

  signIn(email: string, password: string) {

    const headers = new HttpHeaders({
      'Authorization': 'Basic ' + btoa(`${this.clientID}:${this.clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    console.log(headers)
    const data = new URLSearchParams();
    data.set('grant_type', 'password');
    data.set('username', email);
    data.set('password', password);

    console.log(data)
    console.log(data.toString())

    return this.http
      .post<AuthResponseBackend>(this.authUrl,
        data.toString(), { headers }
      ).pipe(tap(resData => {
        console.log(resData.id_token)
        const user = new AuthUser(email, resData.id_token);
        localStorage.setItem('token', resData.id_token);
        this.loggedInUser.next(user);
        return user;
      }));
  }

  logout() {
    this.loggedInUser.next(null);
    this.router.navigate(['/login']);
    localStorage.removeItem('token');
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct.';
        break;
    }
    return throwError(errorMessage);
  }

}