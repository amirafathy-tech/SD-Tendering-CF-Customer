import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { InvoiceComponent } from './invoice/invoice.component';
import { HomePageComponent } from './home-page/home-page.component';
import { CloudDataComponent } from './cloud-data/cloud-data.component';


const routes: Routes = [
 { path: '', component: HomePageComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }, 
  { path: 'home', component: HomePageComponent },
  { path: 'login', component: AuthComponent },
  { path: 'tendering',canActivate:[AuthGuard],  component: InvoiceComponent },
  { path: 'tendering-data',canActivate:[AuthGuard], component: CloudDataComponent },
  //! Without Security:
  //  { path: '', component: CloudDataComponent },
  //   { path: 'tendering',  component: InvoiceComponent },
  // { path: 'tendering-data', component: CloudDataComponent },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
