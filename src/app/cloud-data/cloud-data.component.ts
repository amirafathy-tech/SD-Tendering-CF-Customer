import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { ApiService } from '../shared/ApiService.service';
import { InvoiceService } from '../invoice/invoice.service';


interface ItemNumber{
  SalesQuotationItem:string;
  SalesQuotationItemText:string;
  TransactionCurrency:string;
}

@Component({
  selector: 'app-cloud-data',
  templateUrl: './cloud-data.component.html',
  styleUrls: ['./cloud-data.component.css'],
  providers: [InvoiceService],
})
export class CloudDataComponent {


  nonNegativeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      return value !== null && value < 0 ? { 'negativeValue': true } : null;
    };
  }

  cloudData: FormGroup = new FormGroup({
    document: new FormControl(null, [Validators.required, this.nonNegativeValidator()]),
    item: new FormControl(null, [Validators.required, this.nonNegativeValidator()])
  });

  customerId!:number;
  currency:string | undefined;
  documentItems:ItemNumber[]=[]


  constructor(private router: Router,private _ApiService: ApiService,private _InvoiceService: InvoiceService,) {
  }

  onDocumentEnter(){
    this._ApiService.get<any>(`mainitems/${this.cloudData.value.document}`).subscribe(response => {
      console.log(response);
      console.log(response.d.results);
      this.documentItems=response.d.results;
      console.log(this.documentItems); 
      this.customerId=response.d.SoldToParty;
     });
  }

  onItemNumberChange(event: any): void {
    const selectedValue = event.value; // Selected SalesQuotationItem
    console.log(selectedValue)
    const selectedItem = this.documentItems.find(
      (item) => item.SalesQuotationItem === selectedValue
    );
    this.currency = selectedItem?.TransactionCurrency || undefined;
    console.log('Selected Item currency:', this.currency);
    if(event.value){
      this._ApiService.get<any>(`mainitems/${this.cloudData.value.document}/${event.value}`).subscribe(response => {
        console.log(response);
        this.customerId=response.d.SoldToParty;
       });
    }
  }

  nextPage(cloudData: FormGroup) {

    console.log(cloudData.value);
        if (cloudData.value.document && cloudData.value.item && this.currency && this.customerId) {
        const navigationExtras: NavigationExtras = {
          state: {
            documentNumber: cloudData.value.document,
            itemNumber: cloudData.value.item,
            customerId: this.customerId,
            currency: this.currency,
          }
        };
        console.log(navigationExtras);
        this.router.navigate(['tendering'], navigationExtras);
      }
  }
}
