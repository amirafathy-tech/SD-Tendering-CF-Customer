import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';
import { AuthUser } from '../auth-user.model';
//import { AlertService } from 'src/app/shared/alert.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: []
})

export class LoginComponent implements OnInit {


  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required,
    Validators.email]),
    password: new FormControl('', [Validators.required
      //Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,}$/) 
    ])
  });
  isShown: boolean = true;
  loading = false;
  submitted = false;
  error!: string;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  ngOnInit() {
  }

  onSubmit(userData: FormGroup) {
    console.log(userData);
    console.log(userData.value.username);
    this.loading = true;
    this.authService.signIn(userData.value.username, userData.value.password)
      .subscribe({
        next: (res) => {
          console.log(res);
          const user = new AuthUser(userData.value.username, res.id_token);
          localStorage.setItem('token', res.id_token);
          this.authService.loggedInUser.next(user);
          this.loading = false;
          this.router.navigate(['/tendering-data']);
        },
        error: (error) => {
          console.log(error);
          alert(error)
          this.loading = false;
        },
        complete: () => {
        }
      });
  }
}
