import { NgModule } from '@angular/core';
import { AuthComponent } from './auth.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptorService } from './auth-interceptor.service';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
// import { AlertComponent } from '../shared/alert/alert.component';
import { provideClientHydration } from '@angular/platform-browser';
import { HeaderComponent } from '../header/header.component';

@NgModule({
    declarations: [AuthComponent, LoginComponent, RegisterComponent],
    imports:[
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild([
           // { path: 'auth', component: AuthComponent },
        { path: 'register', component: RegisterComponent },
        { path: 'login', component: LoginComponent }
        ]),
    ],
    // providers: [
    //     provideClientHydration(),
    //     {
    //       provide:HTTP_INTERCEPTORS,
    //       useClass:AuthInterceptorService,
    //       multi:true
    //     }
    //   ],
   
})
export class AuthModule {}