import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpParams,
  HttpHeaders
} from '@angular/common/http';
import { take, exhaustMap } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable()

export class AuthInterceptorService implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return this.authService.loggedInUser.pipe(
      take(1),
      exhaustMap(user => {
        if (!user) {
          return next.handle(req);
        }
       // console.log('User found, adding token:', user.token);
        const modifiedReq = req.clone({
          //params: new HttpParams().set('token', user.token)
          headers:new HttpHeaders().set('Authorization',`Bearer ${user.token}`)
        });
        return next.handle(modifiedReq);
      })
    );
  }
}