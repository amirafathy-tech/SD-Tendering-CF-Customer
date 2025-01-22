import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from '../shared/ApiService.service';
import { MainItem, SubItem } from './invoice.model';

@Injectable()
export class InvoiceService {

  private documentNumber: string | null = null;

  setDocumentNumber(value: string): void {
    console.log("Document number before set:", value);
    this.documentNumber = value;
    console.log("Document number in set:", this.documentNumber);
    
  }

  getDocumentNumber(): string | null {
    return this.documentNumber;
  }

  private mainItems: MainItem[] = [];

  // private mergeMainItems(): void {
  //   try {
  //     // Fetch database items
  //     this.apiService.get<MainItem[]>(`mainitems/referenceid?referenceId=20000017`).subscribe({
  //       next: (response) => {
  //         const databaseItems = response || [];
  //         const databaseItemsWithFlag = databaseItems.map(item => ({ ...item, isPersisted: true }));
  //         const allItems = [
  //           ...this.mainItems, 
  //           ...databaseItemsWithFlag.filter(dbItem => 
  //             !this.mainItems.some(memItem => memItem.invoiceMainItemCode === dbItem.invoiceMainItemCode))
  //         ];
  //         this.mainItems = allItems;
  //         console.log("Merged MainItems:", this.mainItems);
  //       },
  //       error: (error) => {
  //         console.error("Failed to fetch items from the database:", error);
  //       }
  //     });
  //   } catch (error) {
  //     console.error("An error occurred during merging:", error);
  //   }
  // }

  // async mergeMainItems(documentNumber:number): Promise<void> {
  //   try {
  //     // Fetch database items
  //     console.log(documentNumber);
  //     if ( documentNumber !== 0) {
  //       console.log(documentNumber);
  //     const response = await this.apiService.get<MainItem[]>(`mainitems/referenceid?referenceId=${documentNumber}`).toPromise();
  //     const databaseItems = response || [];
  //     //const databaseItemsWithFlag = databaseItems.map(item => ({ ...item, isPersisted: true }));
      
  //     // Merge items
  //     const allItems = [
  //       ...this.mainItems, 
  //       ...databaseItems.filter(dbItem => 
  //         !this.mainItems.some(memItem => memItem.invoiceMainItemCode === dbItem.invoiceMainItemCode))
  //     ];
      
  //     this.mainItems = allItems;
  //     console.log("Merged MainItems:", this.mainItems);
  //   }

  //   } catch (error) {
  //     console.error("Failed to merge main items:", error);
  //   }
  // }

  async mergeMainItems(documentNumber: number): Promise<void> {
    try {
      // Fetch database items
      console.log(documentNumber);
      if (documentNumber !== 0) {
        console.log(documentNumber);
        const response = await this.apiService.get<MainItem[]>(`mainitems/referenceid?referenceId=${documentNumber}`).toPromise();
        const databaseItems = response || [];
  
        // // Merge items
        // const allItems = [
        //   ...this.mainItems,
        //   ...databaseItems.filter(dbItem => 
        //     !this.mainItems.some(memItem => memItem.invoiceMainItemCode === dbItem.invoiceMainItemCode))
        // ];

         // Merge database items with in-memory items
      const allItems = [
        ...this.mainItems.filter(memItem => memItem.isUpdated), // Keep updated memory items
        ...databaseItems.filter(dbItem => 
          !this.mainItems.some(memItem => memItem.invoiceMainItemCode === dbItem.invoiceMainItemCode)
        ),
      ];
  
        // Ensure subItems arrays are independent for each item
        this.mainItems = allItems.map(item => ({
          ...item, // Clone the main item itself
          subItems: [...item.subItems] // Clone subItems array to avoid reference sharing
        }));
  
        console.log("Merged MainItems:", this.mainItems);
      }
  
    } catch (error) {
      console.error("Failed to merge main items:", error);
    }
  }
  
  
  addMainItem(item: MainItem) {
    item.invoiceMainItemCode = Date.now();
    item.isUpdated = true; // Mark as updated
    this.mainItems.push(item);
    console.log(this.mainItems);
  }


  // Add a SubItem to a specific MainItem by ID
async addSubItemToMainItem(mainItemId: number, subItem: SubItem,documentNumber:number): Promise<boolean> {
  try {
    console.log("Calling mergeMainItems...");
    // First, ensure the main items are merged before proceeding

    // Merge items
    //  this.mainItems = [
    //       ...this.mainItems,
    //       ...all.filter(dbItem => 
    //         !this.mainItems.some(memItem => memItem.invoiceMainItemCode === dbItem.invoiceMainItemCode))
    //     ];

    //await this.mergeMainItems(documentNumber);  // This will wait until mergeMainItems is complete

    // Now find the MainItem that matches the provided ID
    let mainItem = this.mainItems.find(item => item.invoiceMainItemCode === mainItemId);
    
    if (mainItem) {
      // Assign the invoiceMainItemCode to the subItem
      subItem.invoiceMainItemCode = mainItemId;
      
      // Add the subItem to the found MainItem
      mainItem.subItems.push(subItem);
      console.log(`SubItem added to MainItem with ID: ${mainItemId}`, mainItem);
      mainItem.isUpdated = true;
      console.log(mainItem);
      
      
      return true;  // Indicate success
    } else {
      console.error(`MainItem with ID: ${mainItemId} not found.`);
      return false;  // Indicate failure if MainItem is not found
    }
  } catch (error) {
    console.error("Error while adding SubItem:", error);
    return false;  // Indicate failure if mergeMainItems or other code fails
  }
}


  //...................................
 
   getMainItems(documentNumber:number): MainItem[] {
   // this.mergeMainItems(documentNumber);  // Ensure merge happens before returning
    console.log(this.mainItems);
    
    // return this.mainItems;
    return [...this.mainItems];
  }



  recordsChanged = new Subject<MainItem[]>();
  startedEditing = new Subject<number>();
  constructor(private apiService: ApiService) { }
  private recordsApi!: MainItem[]

  getRecords() {
    this.apiService.get<MainItem[]>('invoices').subscribe(response => {
      console.log(response);
      this.recordsApi = response;
      this.recordsChanged.next(this.recordsApi);
    });
  }

  getRecord(index: number): Observable<MainItem> {
    return this.apiService.getID<MainItem>('mainitems', index);
  }

  addRecord(record: MainItem) {
    this.apiService.post<MainItem>('mainitems', record).subscribe((response: MainItem) => {
      console.log('mainItem  created:', response);
      this.getRecords();
      return response
    });
  }

  updateRecord(index: number, newRecord: MainItem) {
    this.apiService.put<MainItem>('mainitems', index, newRecord).subscribe(response => {
      console.log('mainitem updated:', response);
      this.getRecords()
    });
  }

  deleteRecord(index: any) {
    this.apiService.delete<MainItem>('mainitems', index).subscribe(response => {
      console.log('mainitem deleted:', response);
      this.getRecords()
    });
  }
};