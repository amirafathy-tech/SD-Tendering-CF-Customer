import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
// import { AlertService } from 'src/app/shared/alert.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

    registerForm: FormGroup = new FormGroup({
        firstName: new FormControl('', [Validators.required]),
        lastName: new FormControl('', [Validators.required]),
        username: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email])
    });

    loading = false;
    submitted = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        // private alertService: AlertService
    ) { }

    ngOnInit() {
    }


    onSubmit(userData: FormGroup) {
        console.log(userData);
        this.submitted = true;
        this.loading = true;
        this.authService.signUp(userData.value.email,userData.value.lastName,userData.value.firstName,userData.value.username)
            .subscribe({
                next: (response) => {
                    console.log(response);
                    this.showPopup=true;
                    this.loading = false;
                    // this.router.navigate(['/login']);
                    // this.alertService.success('Registration Successful', { keepAfterRouteChange: true });
                    //this.router.navigate(['/login'], { relativeTo: this.route });
                },
                error: error => {
                    console.log(error);
                    // this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    showPopup: boolean = false;
      closePopup() {
        this.showPopup = false;
        this.router.navigate(['/login']);
    }
}
