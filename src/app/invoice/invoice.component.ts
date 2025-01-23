import { ChangeDetectorRef, Component } from '@angular/core';
import * as FileSaver from 'file-saver';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InvoiceService } from './invoice.service';
import { MainItem, SubItem } from './invoice.model';
import { ApiService } from '../shared/ApiService.service';
import { ServiceMaster } from '../models/service-master.model';
import { UnitOfMeasure } from '../models/unitOfMeasure.model';
import { Formula } from '../models/formulas.model';
import { Router } from '@angular/router';
import { ModelEntity, ModelSpecDetails } from '../models/model-specs.model';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { main } from '@popperjs/core';

@Component({
  selector: 'app-invoice-test',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css'],
  providers: [MessageService, InvoiceService, ConfirmationService],
  // changeDetection: ChangeDetectionStrategy.Default
})
export class InvoiceComponent {
  //cloud data:
  documentNumber!: number;
  itemNumber!: number;
  customerId!: number;
  cloudCurrency!: string;
  savedDBApp: boolean = false;

  itemText: string = '';

  savedInMemory: boolean = false;


  displayImportsDialog = false;
  displayModelSpecsDialog = false;
  displayModelSpecsDetailsDialog = false;
  displayExcelDialog = false;

  selectedModelSpecsDetails: ModelSpecDetails[] = [];
  models: ModelEntity[] = [];
  modelSpecsDetails: ModelSpecDetails[] = [];

  // Pagination:
  loading: boolean = true;
  loadingSubItems: boolean = true;

  searchKey: string = '';
  currency: any;
  totalValue: number = 0.0;

  // for selection:
  selectedTenderingMainItems: MainItem[] = [];
  selectedTenderingSubItems: SubItem[] = [];
  //fields for dropdown lists
  recordsServiceNumber!: ServiceMaster[];
  selectedServiceNumberRecord?: ServiceMaster;
  selectedServiceNumberRecordForModels?: ServiceMaster;
  selectedServiceNumberRecordForExcel?: ServiceMaster;
  selectedServiceNumber!: number;
  updateSelectedServiceNumber!: number;
  updateSelectedServiceNumberRecord?: ServiceMaster;
  shortText: string = '';
  updateShortText: string = '';
  shortTextChangeAllowed: boolean = false;
  updateShortTextChangeAllowed: boolean = false;

  // service number for subitem :
  selectedServiceNumberRecordSubItem?: ServiceMaster;
  selectedServiceNumberSubItem!: number;
  updateSelectedServiceNumberSubItem!: number;
  updateSelectedServiceNumberRecordSubItem?: ServiceMaster;
  shortTextSubItem: string = '';
  updateShortTextSubItem: string = '';
  shortTextChangeAllowedSubItem: boolean = false;
  updateShortTextChangeAllowedSubItem: boolean = false;

  recordsFormula!: any[];
  selectedFormula!: string;
  selectedFormulaRecord: any;
  updatedFormula!: number;
  updatedFormulaRecord: any;

  // formula for subitem :
  selectedFormulaSubItem!: string;
  selectedFormulaRecordSubItem: any;
  updatedFormulaSubItem!: number;
  updatedFormulaRecordSubItem: any;

  recordsUnitOfMeasure: UnitOfMeasure[] = [];
  selectedUnitOfMeasure!: string;

  // uom for subitem:
  selectedUnitOfMeasureSubItem!: string;

  recordsCurrency!: any[];
  selectedCurrency: string = '';
  // currency for subitem:
  selectedCurrencySubItem!: string;
  //
  selectedRowsForProfit: MainItem[] = [];
  profitMarginValue: number = 0;

  public rowIndex = 0;
  expandedRows: { [key: number]: boolean } = {};
  mainItemsRecords: MainItem[] = [];
  subItemsRecords: SubItem[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private _ApiService: ApiService,
    private _InvoiceService: InvoiceService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.documentNumber =
      this.router.getCurrentNavigation()?.extras.state?.['documentNumber'];
    this.itemNumber =
      this.router.getCurrentNavigation()?.extras.state?.['itemNumber'];
    this.customerId =
      this.router.getCurrentNavigation()?.extras.state?.['customerId'];
    this.cloudCurrency = this.router.getCurrentNavigation()?.extras.state?.['currency'];
    console.log(this.documentNumber, this.itemNumber, this.customerId, this.currency);
  }

  ngOnInit() {
    this._ApiService
      .get<ServiceMaster[]>('servicenumbers')
      .subscribe((response) => {
        this.recordsServiceNumber = response;
        //.filter(record => record.deletionIndicator === false);
      });
    this._ApiService.get<any[]>('formulas').subscribe((response) => {
      this.recordsFormula = response;
    });
    this._ApiService.get<any[]>('currencies').subscribe((response) => {
      this.recordsCurrency = response;
    });
    this._ApiService.get<any[]>('measurements').subscribe((response) => {
      this.recordsUnitOfMeasure = response;
    });
    if (this.savedInMemory) {
      this.mainItemsRecords = [
        ...this._InvoiceService.getMainItems(this.documentNumber),
      ];
      console.log(this.mainItemsRecords);
    }
    if (this.savedDBApp) {
      this.getCloudDocument();
    } else {
      this.getCloudDocument();
    }

    this._ApiService.get<SubItem[]>('subitems').subscribe((response) => {
      this.subItemsRecords = response;
      this.loadingSubItems = false;
    });
  }

  getCloudDocument() {
    //localhost:8080/mainitems/referenceid?referenceId=20000000&salesQuotationItem=20
    this._ApiService
      .get<MainItem[]>(
        `mainitems/referenceid?referenceId=${this.documentNumber}&salesQuotationItem=${this.itemNumber}`
      )
      .subscribe({
        next: (res) => {
          this.mainItemsRecords = res
            .map((item) => ({ ...item, isPersisted: true }))
            .sort((a, b) => a.invoiceMainItemCode - b.invoiceMainItemCode);
          this.itemText = this.mainItemsRecords[0].salesQuotationItemText
            ? this.mainItemsRecords[0].salesQuotationItemText
            : '';
          console.log(this.itemText);
          console.log(this.mainItemsRecords);
          console.log(this.mainItemsRecords[0].subItems);
          console.log(this.mainItemsRecords[0].subItems.length);

          this.loading = false;
          this.totalValue = this.mainItemsRecords.reduce(
            (sum, record) => sum + record.totalWithProfit,
            0
          );
          console.log('Total Value:', this.totalValue);
          // this.cdr.detectChanges();
        },
        error: (err) => {
          console.log(err);
          console.log(err.status);
          if (err.status == 404) {
            this.mainItemsRecords = [];
            this.loading = false;
            this.totalValue = this.mainItemsRecords.reduce(
              (sum, record) => sum + record.totalWithProfit,
              0
            );
            console.log('Total Value:', this.totalValue);
            //this.cdr.detectChanges();
          }
        },
        complete: () => { },
      });
  }

  // search:
  // originalMainItemsRecords: MainItem[] = []; // Keep a copy of the original records


  filterRecords(): void {
    // this.originalMainItemsRecords = [...this.mainItemsRecords];
    if (this.searchKey && this.searchKey.trim() !== '') {
      this.mainItemsRecords = this.mainItemsRecords.filter((record: any) =>
        record.description.toLowerCase().includes(this.searchKey.toLowerCase())
      );
    } else {
      //  this.mainItemsRecords = [...this.originalMainItemsRecords];
      console.log("else");

      this.mainItemsRecords = [...this.mainItemsRecords];
      console.log(this.mainItemsRecords);

    }
  }


  // Imports ()
  showImportsDialog() {
    this.displayImportsDialog = true;
  }
  showExcelDialog() {
    this.displayExcelDialog = true;
  }
  showModelSpecsDialog() {
    this.displayModelSpecsDialog = true;
    this._ApiService.get<ModelEntity[]>(`modelspecs`).subscribe({
      next: (res) => {
        // const uniqueRecords = res.filter(newRecord => 
        //   !this.mainItemsRecords.some(existingRecord => 
        //     existingRecord.invoiceMainItemCode === newRecord.modelSpecCode
        //   )
        // );
        this.models = res.sort((a, b) => a.modelSpecCode - b.modelSpecCode);
        console.log(this.models);
      }
      , error: (err) => {
        console.log(err);
      },
      complete: () => {
      }
    });
  }
  showModelSpecsDetailsDialog(model: ModelEntity) {
    this.displayModelSpecsDetailsDialog = true;
    const detailObservables = model.modelSpecDetailsCode.map(code =>
      this._ApiService.getID<ModelSpecDetails>('modelspecdetails', code)
    );
    forkJoin(detailObservables).subscribe(records => {
      this.modelSpecsDetails = records.sort((a, b) => b.modelSpecDetailsCode - a.modelSpecDetailsCode);
    });
  }
  saveSelectionModelSpecsDetails() {
    console.log('Selected items:', this.selectedModelSpecsDetails);
    this.displayModelSpecsDetailsDialog = false;
    this.displayModelSpecsDialog = false;
    this.displayImportsDialog = false;
  }

  // for selected models specs details:
  saveModelSpecsDetails(mainItem: ModelSpecDetails) {
    console.log(mainItem);
    if (this.selectedServiceNumberRecordForModels && this.selectedFormulaRecord && this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: this.selectedServiceNumberRecordForModels.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: this.selectedServiceNumberRecordForModels.description,

        formulaCode: this.selectedFormula,
        quantity: this.resultAfterTest,
        // quantity: item.quantity,
        amountPerUnit: mainItem.grossPrice,
        total: mainItem.netValue,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        // doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        subItems: []
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForModels = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.selectedModelSpecsDetails.findIndex(item => item.modelSpecDetailsCode === mainItem.modelSpecDetailsCode);
            if (index !== -1) {
              this.selectedModelSpecsDetails.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
    if (!this.selectedServiceNumberRecordForModels && this.selectedFormulaRecord && this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: mainItem.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: mainItem.shortText,

        formulaCode: this.selectedFormula,
        quantity: this.resultAfterTest,
        // quantity: item.quantity,
        amountPerUnit: mainItem.grossPrice,
        total: mainItem.netValue,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        // doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        subItems: []
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForModels = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.selectedModelSpecsDetails.findIndex(item => item.modelSpecDetailsCode === mainItem.modelSpecDetailsCode);
            if (index !== -1) {
              this.selectedModelSpecsDetails.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
    if (this.selectedServiceNumberRecordForModels && !this.selectedFormulaRecord && !this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: this.selectedServiceNumberRecordForModels.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: this.selectedServiceNumberRecordForModels.description,

        formulaCode: mainItem.formulaCode,
        quantity: mainItem.quantity,
        amountPerUnit: mainItem.grossPrice,
        total: mainItem.netValue,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        // doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        subItems: []
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForModels = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.selectedModelSpecsDetails.findIndex(item => item.modelSpecDetailsCode === mainItem.modelSpecDetailsCode);
            if (index !== -1) {
              this.selectedModelSpecsDetails.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
    if (!this.selectedServiceNumberRecordForModels && !this.selectedFormulaRecord && !this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: mainItem.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: mainItem.shortText,

        formulaCode: mainItem.formulaCode,
        quantity: mainItem.quantity,
        amountPerUnit: mainItem.grossPrice,
        total: mainItem.netValue,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        // doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        subItems: []
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForModels = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.selectedModelSpecsDetails.findIndex(item => item.modelSpecDetailsCode === mainItem.modelSpecDetailsCode);
            if (index !== -1) {
              this.selectedModelSpecsDetails.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }

  }
  cancelModelSpecsDetails(item: any): void {
    this.selectedModelSpecsDetails = this.selectedModelSpecsDetails.filter(i => i !== item);
  }
  // for selected from excel sheet:
  saveMainItemFromExcel(mainItem: MainItem) {
    console.log(mainItem);
    if (this.selectedServiceNumberRecordForExcel && this.selectedFormulaRecord && this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: this.selectedServiceNumberRecordForExcel.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: this.selectedServiceNumberRecordForExcel.description,

        formulaCode: this.selectedFormula,
        quantity: this.resultAfterTest,
        // quantity: item.quantity,
        amountPerUnit: mainItem.amountPerUnit,
        total: mainItem.total,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        // subItems: []
        subItems: mainItem.subItems
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForExcel = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.parsedData.findIndex(item => item.invoiceMainItemCode === mainItem.invoiceMainItemCode);
            if (index !== -1) {
              this.parsedData.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
    if (!this.selectedServiceNumberRecordForExcel && this.selectedFormulaRecord && this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: mainItem.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: mainItem.description,

        formulaCode: this.selectedFormula,
        quantity: this.resultAfterTest,
        // quantity: item.quantity,
        amountPerUnit: mainItem.amountPerUnit,
        total: mainItem.total,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        // subItems: []
        subItems: mainItem.subItems
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForExcel = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.parsedData.findIndex(item => item.invoiceMainItemCode === mainItem.invoiceMainItemCode);
            if (index !== -1) {
              this.parsedData.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
    if (this.selectedServiceNumberRecordForExcel && !this.selectedFormulaRecord && !this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: this.selectedServiceNumberRecordForExcel.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: this.selectedServiceNumberRecordForExcel.description,

        formulaCode: mainItem.formulaCode,
        quantity: mainItem.quantity,
        amountPerUnit: mainItem.amountPerUnit,
        total: mainItem.total,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        // subItems: []
        subItems: mainItem.subItems
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForExcel = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.parsedData.findIndex(item => item.invoiceMainItemCode === mainItem.invoiceMainItemCode);
            if (index !== -1) {
              this.parsedData.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
    if (!this.selectedServiceNumberRecordForExcel && !this.selectedFormulaRecord && !this.resultAfterTest) {
      const newRecord: MainItem = {
        //
        invoiceMainItemCode: 0,
        //
        serviceNumberCode: mainItem.serviceNumberCode,
        unitOfMeasurementCode: mainItem.unitOfMeasurementCode,
        currencyCode: mainItem.currencyCode,
        description: mainItem.description,

        formulaCode: mainItem.formulaCode,
        quantity: mainItem.quantity,
        amountPerUnit: mainItem.amountPerUnit,
        total: mainItem.total,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        doNotPrint: mainItem.doNotPrint,
        Type: '',
        isPersisted: false,
        //subItems: []
        subItems: mainItem.subItems
      }
      console.log(newRecord);
      if (newRecord.quantity === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: ' Quantity is required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        //................
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
          bodyRequest.profitMargin = newRecord.profitMargin;
        }
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            newRecord.total = res.total;
            newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            newRecord.totalWithProfit = res.totalWithProfit;
            console.log(' Record:', newRecord);
            const filteredRecord = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return value !== '' && value !== 0 && value !== undefined && value !== null;
              })
            ) as MainItem;
            console.log(filteredRecord);
            this.addMainItem(filteredRecord);

            this.mainItemsRecords = [...this.mainItemsRecords];
            this.savedInMemory = true;
            this.updateTotalValueAfterAction();
            console.log(this.mainItemsRecords);
            this.resetNewMainItem();
            this.selectedServiceNumberRecordForExcel = undefined;
            this.selectedFormula = '';
            this.selectedFormulaRecord = undefined;
            this.resultAfterTest = undefined;

            const index = this.parsedData.findIndex(item => item.invoiceMainItemCode === mainItem.invoiceMainItemCode);
            if (index !== -1) {
              this.parsedData.splice(index, 1);
            }
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
          }
        });
        //................
      }
    }
  }
  cancelFromExcel(item: any): void {
    this.parsedData = this.parsedData.filter(i => i !== item);
  }

  // Excel Import:
  parsedData: MainItem[] = []; // Parsed data from the Excel file
  displayedColumns: string[] = []; // Column headers from the Excel file


  // worked function without subitems:
  // onFileSelect(event: any, fileUploader: any) {
  //   console.log('Records before :', this.parsedData);

  //   const file = event.files[0];
  //   const reader = new FileReader();

  //   reader.onload = (e: any) => {
  //     const binaryData = e.target.result;
  //     const workbook = XLSX.read(binaryData, { type: 'binary' });

  //     const sheetName = workbook.SheetNames[0];
  //     const sheet = workbook.Sheets[sheetName];

  //     const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  //     if (jsonData.length > 0) {
  //       this.displayedColumns = jsonData[0].filter((col: any) => typeof col === 'string' && col.trim() !== '') as string[];
  //       this.parsedData = jsonData
  //         .slice(1) // Skip the header row
  //         .map((row: any[]) => {
  //           const rowData: any = {};
  //           this.displayedColumns.forEach((col, index) => {
  //             rowData[col] = row[index] !== undefined ? row[index] : '';
  //           });
  //           return rowData;
  //         })
  //         .filter((rowData: any) => rowData.Type === 'Main Item'); // Filter only "Main Item" rows

  //       console.log('Filtered Records :', this.parsedData);
  //       this.messageService.add({
  //         severity: 'success',
  //         summary: 'Success',
  //         detail: 'Main Item records copied from the Excel sheet successfully!',
  //         life: 4000,
  //       });
  //     } else {
  //       this.displayedColumns = [];
  //       this.parsedData = [];
  //     }

  //     fileUploader.clear();
  //   };

  //   reader.readAsBinaryString(file);
  // }

  // new with subitems:
  onFileSelect(event: any, fileUploader: any) {
    console.log('Records before :', this.parsedData);

    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: 'binary' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length > 0) {
        this.displayedColumns = jsonData[0].filter((col: any) => typeof col === 'string' && col.trim() !== '') as string[];

        const rawParsedData = jsonData.slice(1).map((row: any[]) => {
          const rowData: any = {};
          this.displayedColumns.forEach((col, index) => {
            rowData[col] = row[index] !== undefined ? row[index] : '';
          });
          return rowData;
        });

        // Parse Main Items and their related Sub Items
        this.parsedData = [];
        let currentMainItem: any = null;

        rawParsedData.forEach((rowData: any) => {
          if (rowData.Type === 'Main Item') {
            // Start a new Main Item
            currentMainItem = { ...rowData, subItems: [] };
            this.parsedData.push(currentMainItem);
          } else if (rowData.Type === 'Sub Item' && currentMainItem) {
            // Add Sub Item to the current Main Item
            currentMainItem.subItems.push(rowData);
          }
        });

        console.log('Hierarchical Parsed Data :', this.parsedData);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Main Item and related Sub Item records processed successfully!',
          life: 4000,
        });
      } else {
        this.displayedColumns = [];
        this.parsedData = [];
      }

      fileUploader.clear();
    };

    reader.readAsBinaryString(file);
  }

  updateProfitMargin(value: number) {
    console.log(value);
    if (value !== null && value < 0) {
      this.profitMarginValue = 0;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Negative values are not allowed',
        life: 4000,
      });
    } else {

      // for (const row of this.selectedRowsForProfit) {
      for (const row of this.selectedTenderingMainItems) {
        row.profitMargin = value;
        const {
          invoiceMainItemCode,
          // totalWithProfit,
          ...mainItemWithoutMainItemCode
        } = row;
        const updatedMainItem = this.removePropertiesFrom(
          mainItemWithoutMainItemCode,
          ['invoiceMainItemCode', 'invoiceSubItemCode']
        );
        console.log(updatedMainItem);
        const newRecord: MainItem = {
          ...updatedMainItem,
          // Modify specific attributes
          subItems: (row?.subItems ?? []).map((subItem) =>
            this.removeProperties(subItem, [
              'invoiceMainItemCode',
              'invoiceSubItemCode',
            ])
          ),
          profitMargin: value,
        };
        console.log(newRecord);
        const updatedRecord = this.removeProperties(newRecord, ['selected']);
        console.log(updatedRecord);

        const bodyRequest: any = {
          quantity: updatedRecord.quantity,
          amountPerUnit: updatedRecord.amountPerUnit,
          profitMargin: updatedRecord.profitMargin,
          //total: updatedRecord.total
        };

        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: (res) => {
            console.log('mainitem with total:', res);
            // this.totalValue = 0;
            updatedRecord.total = res.total;
            updatedRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
            updatedRecord.totalWithProfit = res.totalWithProfit;

            const mainItemIndex = this.mainItemsRecords.findIndex(
              (item) => item.invoiceMainItemCode === invoiceMainItemCode
            );
            if (mainItemIndex > -1) {
              this.mainItemsRecords[mainItemIndex] = {
                ...this.mainItemsRecords[mainItemIndex],
                ...updatedRecord,
              };

              this.updateTotalValueAfterAction();
            }
            //  this.cdr.detectChanges();
            console.log(this.mainItemsRecords);
          },
          error: (err) => {
            console.log(err);
          },
          complete: () => {
            this.selectedTenderingMainItems = [];
            // this.selectedRowsForProfit = [];
            // this.selectedMainItems = [];
          },
        });
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'The Profit Margin has been applied successfully',
        life: 3000,
      });
    }
  }
  // Calculate Header Total Value:
  calculateTotalValue(): void {
    console.log(this.mainItemsRecords);
    this.totalValue = this.mainItemsRecords.reduce(
      (sum, item) => sum + (item.totalWithProfit || 0),
      0
    );
  }
  updateTotalValueAfterAction(): void {
    this.calculateTotalValue();
    console.log('Updated Total Value:', this.totalValue);
  }

  // For Add new  Main Item
  newMainItem: MainItem = {
    Type: '',
    invoiceMainItemCode: 0,
    serviceNumberCode: 0,
    description: '',
    quantity: 0,
    unitOfMeasurementCode: '',
    formulaCode: '',
    amountPerUnit: 0,
    currencyCode: '',
    total: 0,
    profitMargin: 0,
    totalWithProfit: 0,
    subItems: [],
    isPersisted: false,
  };

  addMainItemInMemory() {
    if (!this.selectedServiceNumberRecord && !this.selectedFormulaRecord) {
      // if user didn't select serviceNumber && didn't select formula
      const newRecord: MainItem = {
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.cloudCurrency,
        //this.selectedCurrency,
        description: this.newMainItem.description,
        quantity: this.newMainItem.quantity,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit,
        temporaryDeletion: 'temporary',
        referenceId: this.documentNumber,

        Type: '',
        invoiceMainItemCode: 0,
        subItems: [],
        isPersisted: false,
      };
      console.log(newRecord);

      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;
          console.log(' Record:', newRecord);

          const filteredRecord = Object.fromEntries(
            Object.entries(newRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          ) as MainItem;
          console.log('Filtered Record:', filteredRecord);
          //this._InvoiceService.addMainItem(filteredRecord);
          this.addMainItem(filteredRecord);
          this.mainItemsRecords = [...this.mainItemsRecords];
          console.log(this.totalValue);
          this.savedInMemory = true;
          // this.cdr.detectChanges();
          // const newMainItems = this._InvoiceService.getMainItems(this.documentNumber);
          // console.log(newMainItems);
          // // Combine the current mainItemsRecords with the new list, ensuring no duplicates
          // this.mainItemsRecords = [
          //   ...this.mainItemsRecords.filter(item => !newMainItems.some(newItem => newItem.invoiceMainItemCode === item.invoiceMainItemCode)), // Remove existing items
          //   ...newMainItems
          // ];
          this.updateTotalValueAfterAction();
          console.log(this.mainItemsRecords);
          this.resetNewMainItem();
          this.selectedUnitOfMeasure = '';
          this.selectedCurrency = '';
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
    }
    else if (
      !this.selectedServiceNumberRecord &&
      this.selectedFormulaRecord &&
      this.resultAfterTest
    ) {
      // if user didn't select serviceNumber && select formula
      const newRecord: MainItem = {
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.cloudCurrency,
        //this.selectedCurrency,
        formulaCode: this.selectedFormula,
        description: this.newMainItem.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit,
        temporaryDeletion: 'temporary',
        referenceId: this.documentNumber,
        Type: '',
        invoiceMainItemCode: 0,
        subItems: [],
        isPersisted: false,
      };
      // if (this.resultAfterTest === 0 || this.newMainItem.description === "" || this.selectedCurrency === "") {
      //   // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
      //     life: 3000
      //   });
      // }
      // else {
      console.log(newRecord);
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;
          const filteredRecord = Object.fromEntries(
            Object.entries(newRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          ) as MainItem;
          console.log(filteredRecord);

          this.addMainItem(filteredRecord);
          this.mainItemsRecords = [...this.mainItemsRecords];
          this.savedInMemory = true;
          this.updateTotalValueAfterAction();
          console.log(this.mainItemsRecords);
          this.resetNewMainItem();
          this.selectedUnitOfMeasure = '';
          this.selectedCurrency = '';
          this.selectedFormula = '';
          this.selectedFormulaRecord = undefined;
          this.resultAfterTest = undefined;
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
    } else if (
      this.selectedServiceNumberRecord &&
      !this.selectedFormulaRecord &&
      !this.resultAfterTest
    ) {
      // if user select serviceNumber && didn't select formula
      const newRecord: MainItem = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode:
          this.selectedServiceNumberRecord.unitOfMeasurementCode,
        // this.selectedServiceNumberRecord.baseUnitOfMeasurement,
        currencyCode: this.cloudCurrency,
        // this.selectedCurrency,
        description: this.selectedServiceNumberRecord.description,
        quantity: this.newMainItem.quantity,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit,
        temporaryDeletion: 'temporary',
        referenceId: this.documentNumber,
        Type: '',
        invoiceMainItemCode: 0,
        subItems: [],
        isPersisted: false,
      };
      // if (this.newMainItem.quantity === 0 || this.selectedServiceNumberRecord.description === "" || this.selectedCurrency === "") {
      //   // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
      //     life: 3000
      //   });
      // }
      // else {
      console.log(newRecord);
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;
          const filteredRecord = Object.fromEntries(
            Object.entries(newRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          ) as MainItem;
          console.log(filteredRecord);

          this.addMainItem(filteredRecord);
          this.mainItemsRecords = [...this.mainItemsRecords];
          console.log(this.totalValue);
          this.savedInMemory = true;
          // this.cdr.detectChanges();
          this.updateTotalValueAfterAction();
          console.log(this.mainItemsRecords);
          this.resetNewMainItem();
          this.selectedServiceNumberRecord = undefined;
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
    } else if (
      this.selectedServiceNumberRecord &&
      this.selectedFormulaRecord &&
      this.resultAfterTest
    ) {
      // if user select serviceNumber && select formula
      const newRecord: MainItem = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode:
          this.selectedServiceNumberRecord.unitOfMeasurementCode,
        // this.selectedServiceNumberRecord.baseUnitOfMeasurement,
        currencyCode: this.cloudCurrency,
        //this.selectedCurrency,
        formulaCode: this.selectedFormula,
        description: this.selectedServiceNumberRecord.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit,
        temporaryDeletion: 'temporary',
        referenceId: this.documentNumber,
        Type: '',
        invoiceMainItemCode: 0,
        subItems: [],
        isPersisted: false,
      };
      // if (this.resultAfterTest === 0 || this.selectedServiceNumberRecord.description === "" || this.selectedCurrency === "") {
      //   // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
      //     life: 3000
      //   });
      // }
      // else {
      console.log(newRecord);
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;
          const filteredRecord = Object.fromEntries(
            Object.entries(newRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          ) as MainItem;
          console.log(filteredRecord);
          this.addMainItem(filteredRecord);
          this.mainItemsRecords = [...this.mainItemsRecords];
          console.log(this.totalValue);
          this.savedInMemory = true;
          // this.cdr.detectChanges();
          this.updateTotalValueAfterAction();
          console.log(this.mainItemsRecords);
          this.resetNewMainItem();
          this.selectedServiceNumberRecord = undefined;
          this.selectedFormula = '';
          this.selectedFormulaRecord = undefined;
          this.selectedCurrency = '';
          this.resultAfterTest = undefined;
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
    }
  }

  // For Add new  Sub Item
  newSubItem: SubItem = {
    Type: '',
    invoiceSubItemCode: 0,
    // invoiceMainItemCode: 0,
    serviceNumberCode: 0,
    description: '',
    quantity: 0,
    unitOfMeasurementCode: '',
    formulaCode: '',
    amountPerUnit: 0,
    currencyCode: '',
    total: 0,
  };
  addSubItemInMemory(mainItem: MainItem) {
    console.log(mainItem);
    if (
      !this.selectedServiceNumberRecordSubItem &&
      !this.selectedFormulaRecordSubItem
    ) {
      // if user didn't select serviceNumber && didn't select formula
      const newRecord: SubItem = {
        unitOfMeasurementCode: this.selectedUnitOfMeasureSubItem,
        currencyCode: this.cloudCurrency,
        //this.selectedCurrencySubItem,
        description: this.newSubItem.description,
        quantity: this.newSubItem.quantity,
        amountPerUnit: this.newSubItem.amountPerUnit,
        Type: '',
        invoiceSubItemCode: Date.now(),
      };
      if (this.newSubItem.amountPerUnit === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'AmountPerUnit is required',
          life: 3000,
        });
      } else {
        console.log(newRecord);
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: async (res) => {
            console.log('subitem with total:', res);
            newRecord.total = res.total;
            const filteredSubItem = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return (
                  value !== '' &&
                  value !== 0 &&
                  value !== undefined &&
                  value !== null
                );
              })
            ) as SubItem;
            console.log(filteredSubItem);

            console.log(this.mainItemsRecords);
            const success = this.addSubItemToMainItem(
              mainItem.invoiceMainItemCode,
              filteredSubItem,
              this.documentNumber
            );
            // const success = await this._InvoiceService.addSubItemToMainItem(mainItem.invoiceMainItemCode, filteredSubItem, this.documentNumber);
            if (success) {
              this.savedInMemory = true;
              console.log(this.mainItemsRecords);
              const mainItemIndex = this.mainItemsRecords.findIndex(
                (item) =>
                  item.invoiceMainItemCode === mainItem.invoiceMainItemCode
              );
              console.log(mainItemIndex);
              this.cdr.detectChanges();
              if (mainItemIndex > -1) {
                console.log(mainItemIndex);
                // Check if subitem already exists by comparing invoiceSubItemCode
                const existingSubItem = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.find(
                  (subItem) =>
                    String(subItem.invoiceSubItemCode).trim() ===
                    String(filteredSubItem['invoiceSubItemCode']).trim()
                );
                console.log('Existing SubItem:', existingSubItem);
                if (!existingSubItem) {
                  this.mainItemsRecords[mainItemIndex].subItems.push(
                    filteredSubItem as SubItem
                  );
                  console.log(this.mainItemsRecords);
                }
                // else {
                console.log('Duplicate subitem detected; skipping addition.');
                console.log(this.mainItemsRecords);
                ///......
                // Calculate the sum of total values for all subitems
                const totalOfSubItems = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.reduce(
                  (sum, subItem) => sum + (subItem.total || 0),
                  0
                );
                this.mainItemsRecords[mainItemIndex].amountPerUnit =
                  totalOfSubItems;
                console.log(
                  `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
                  this.mainItemsRecords[mainItemIndex].amountPerUnit
                );
                // Recalculate the main item's total, amountPerUnitWithProfit, and totalWithProfit
                const recalculateBodyRequest: any = {
                  quantity: this.mainItemsRecords[mainItemIndex].quantity,
                  amountPerUnit: totalOfSubItems,
                };
                if (
                  this.mainItemsRecords[mainItemIndex].profitMargin &&
                  this.mainItemsRecords[mainItemIndex].profitMargin !== 0
                ) {
                  recalculateBodyRequest.profitMargin =
                    this.mainItemsRecords[mainItemIndex].profitMargin;
                }
                this._ApiService
                  .post<any>(`/total`, recalculateBodyRequest)
                  .subscribe({
                    next: (recalculateRes) => {
                      console.log('Updated main item totals:', recalculateRes);

                      this.mainItemsRecords[mainItemIndex] = {
                        ...this.mainItemsRecords[mainItemIndex],
                        total: recalculateRes.total,
                        amountPerUnitWithProfit:
                          recalculateRes.amountPerUnitWithProfit,
                        totalWithProfit: recalculateRes.totalWithProfit,
                      };
                      console.log(
                        `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                        this.mainItemsRecords[mainItemIndex]
                      );
                      this.updateTotalValueAfterAction();
                      // this.cdr.detectChanges();
                    },
                    error: (err) => {
                      console.error('Failed to recalculate totals:', err);
                    },
                  });
                ///......
              }
              // }
              this.resetNewSubItem();
              this.selectedUnitOfMeasureSubItem = '';
              this.selectedCurrencySubItem = '';
              console.log(this.mainItemsRecords);
            }
          },
          error: (err) => {
            console.log(err);
          },
          complete: () => { },
        });
      }
    } else if (
      !this.selectedServiceNumberRecordSubItem &&
      this.selectedFormulaRecordSubItem &&
      this.resultAfterTest
    ) {
      // if user didn't select serviceNumber && select formula
      const newRecord: SubItem = {
        unitOfMeasurementCode: this.selectedUnitOfMeasureSubItem,
        currencyCode: this.cloudCurrency,
        //this.selectedCurrencySubItem,
        formulaCode: this.selectedFormulaSubItem,
        description: this.newSubItem.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newSubItem.amountPerUnit,
        Type: '',
        invoiceSubItemCode: Date.now(),
      };
      if (this.newSubItem.amountPerUnit === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'AmountPerUnit is required',
          life: 3000,
        });
      } else {
        console.log(newRecord);
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: async (res) => {
            console.log('subitem with total:', res);
            newRecord.total = res.total;
            const filteredSubItem = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return (
                  value !== '' &&
                  value !== 0 &&
                  value !== undefined &&
                  value !== null
                );
              })
            );
            console.log(filteredSubItem);
            const success = this.addSubItemToMainItem(
              mainItem.invoiceMainItemCode,
              filteredSubItem as SubItem,
              this.documentNumber
            );
            if (success) {
              this.savedInMemory = true;
              const mainItemIndex = this.mainItemsRecords.findIndex(
                (item) =>
                  item.invoiceMainItemCode === mainItem.invoiceMainItemCode
              );
              if (mainItemIndex > -1) {
                // Check if subitem already exists by comparing invoiceSubItemCode
                const existingSubItem = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.find(
                  (subItem) =>
                    subItem.invoiceSubItemCode ===
                    filteredSubItem['invoiceSubItemCode']
                );
                if (!existingSubItem) {
                  this.mainItemsRecords[mainItemIndex].subItems.push(
                    filteredSubItem as SubItem
                  );
                  console.log(this.mainItemsRecords);
                }
                //else {
                console.log('Duplicate subitem detected; skipping addition.');
                console.log(this.mainItemsRecords);
                ///......
                // Calculate the sum of total values for all subitems
                const totalOfSubItems = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.reduce(
                  (sum, subItem) => sum + (subItem.total || 0),
                  0
                );
                this.mainItemsRecords[mainItemIndex].amountPerUnit =
                  totalOfSubItems;
                console.log(
                  `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
                  this.mainItemsRecords[mainItemIndex].amountPerUnit
                );
                // Recalculate the main item's total, amountPerUnitWithProfit, and totalWithProfit
                const recalculateBodyRequest: any = {
                  quantity: this.mainItemsRecords[mainItemIndex].quantity,
                  amountPerUnit: totalOfSubItems,
                };
                if (
                  this.mainItemsRecords[mainItemIndex].profitMargin &&
                  this.mainItemsRecords[mainItemIndex].profitMargin !== 0
                ) {
                  recalculateBodyRequest.profitMargin =
                    this.mainItemsRecords[mainItemIndex].profitMargin;
                }
                this._ApiService
                  .post<any>(`/total`, recalculateBodyRequest)
                  .subscribe({
                    next: (recalculateRes) => {
                      console.log('Updated main item totals:', recalculateRes);
                      this.mainItemsRecords[mainItemIndex] = {
                        ...this.mainItemsRecords[mainItemIndex],
                        total: recalculateRes.total,
                        amountPerUnitWithProfit:
                          recalculateRes.amountPerUnitWithProfit,
                        totalWithProfit: recalculateRes.totalWithProfit,
                      };
                      console.log(
                        `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                        this.mainItemsRecords[mainItemIndex]
                      );
                      this.updateTotalValueAfterAction();
                      // this.cdr.detectChanges();
                    },
                    error: (err) => {
                      console.error('Failed to recalculate totals:', err);
                    },
                  });
                ///......
                //}
              }
              this.resetNewSubItem();
              this.selectedUnitOfMeasureSubItem = '';
              this.selectedCurrencySubItem = '';
              this.selectedFormulaSubItem = '';
              this.selectedFormulaRecordSubItem = undefined;
              this.resultAfterTest = undefined;
              console.log(this.mainItemsRecords);
            }
          },
          error: (err) => {
            console.log(err);
          },
          complete: () => { },
        });
      }
    } else if (
      this.selectedServiceNumberRecordSubItem &&
      !this.selectedFormulaRecordSubItem &&
      !this.resultAfterTest
    ) {
      // if user select serviceNumber && didn't select formula
      const newRecord: SubItem = {
        serviceNumberCode: this.selectedServiceNumberSubItem,
        unitOfMeasurementCode:
          this.selectedServiceNumberRecordSubItem.unitOfMeasurementCode,
        //this.selectedServiceNumberRecordSubItem.baseUnitOfMeasurement,
        currencyCode: this.cloudCurrency,
        // this.selectedCurrencySubItem,
        description: this.selectedServiceNumberRecordSubItem.description,
        quantity: this.newSubItem.quantity,
        amountPerUnit: this.newSubItem.amountPerUnit,
        Type: '',
        invoiceSubItemCode: Date.now(),
      };
      if (this.newSubItem.amountPerUnit === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'AmountPerUnit is required',
          life: 3000,
        });
      } else {
        console.log(newRecord);
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: async (res) => {
            console.log('subitem with total:', res);
            newRecord.total = res.total;
            const filteredSubItem = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return (
                  value !== '' &&
                  value !== 0 &&
                  value !== undefined &&
                  value !== null
                );
              })
            );
            console.log(filteredSubItem);
            const success = this.addSubItemToMainItem(
              mainItem.invoiceMainItemCode,
              filteredSubItem as SubItem,
              this.documentNumber
            );
            if (success) {
              this.savedInMemory = true;
              const mainItemIndex = this.mainItemsRecords.findIndex(
                (item) =>
                  item.invoiceMainItemCode === mainItem.invoiceMainItemCode
              );
              if (mainItemIndex > -1) {
                // Check if subitem already exists by comparing invoiceSubItemCode
                const existingSubItem = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.find(
                  (subItem) =>
                    subItem.invoiceSubItemCode ===
                    filteredSubItem['invoiceSubItemCode']
                );
                if (!existingSubItem) {
                  this.mainItemsRecords[mainItemIndex].subItems.push(
                    filteredSubItem as SubItem
                  );
                  console.log(this.mainItemsRecords);
                }
                //else {
                console.log('Duplicate subitem detected; skipping addition.');
                console.log(this.mainItemsRecords);
                ///......
                // Calculate the sum of total values for all subitems
                const totalOfSubItems = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.reduce(
                  (sum, subItem) => sum + (subItem.total || 0),
                  0
                );
                this.mainItemsRecords[mainItemIndex].amountPerUnit =
                  totalOfSubItems;
                console.log(
                  `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
                  this.mainItemsRecords[mainItemIndex].amountPerUnit
                );
                // Recalculate the main item's total, amountPerUnitWithProfit, and totalWithProfit
                const recalculateBodyRequest: any = {
                  quantity: this.mainItemsRecords[mainItemIndex].quantity,
                  amountPerUnit: totalOfSubItems,
                };
                if (
                  this.mainItemsRecords[mainItemIndex].profitMargin &&
                  this.mainItemsRecords[mainItemIndex].profitMargin !== 0
                ) {
                  recalculateBodyRequest.profitMargin =
                    this.mainItemsRecords[mainItemIndex].profitMargin;
                }
                this._ApiService
                  .post<any>(`/total`, recalculateBodyRequest)
                  .subscribe({
                    next: (recalculateRes) => {
                      console.log('Updated main item totals:', recalculateRes);
                      this.mainItemsRecords[mainItemIndex] = {
                        ...this.mainItemsRecords[mainItemIndex],
                        total: recalculateRes.total,
                        amountPerUnitWithProfit:
                          recalculateRes.amountPerUnitWithProfit,
                        totalWithProfit: recalculateRes.totalWithProfit,
                      };
                      console.log(
                        `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                        this.mainItemsRecords[mainItemIndex]
                      );
                      this.updateTotalValueAfterAction();
                      // this.cdr.detectChanges();
                    },
                    error: (err) => {
                      console.error('Failed to recalculate totals:', err);
                    },
                  });
                ///......
                // }
              }
              this.resetNewSubItem();
              this.selectedCurrencySubItem = '';
              this.selectedFormulaRecordSubItem = undefined;
              this.selectedServiceNumberRecordSubItem = undefined;
              console.log(this.mainItemsRecords);
            }
          },
          error: (err) => {
            console.log(err);
          },
          complete: () => { },
        });
      }
    } else if (
      this.selectedServiceNumberRecordSubItem &&
      this.selectedFormulaRecordSubItem &&
      this.resultAfterTest
    ) {
      // if user select serviceNumber && select formula
      const newRecord: SubItem = {
        serviceNumberCode: this.selectedServiceNumberSubItem,
        unitOfMeasurementCode:
          this.selectedServiceNumberRecordSubItem.unitOfMeasurementCode,
        //this.selectedServiceNumberRecordSubItem.baseUnitOfMeasurement,
        currencyCode: this.cloudCurrency,
        //this.selectedCurrencySubItem,
        formulaCode: this.selectedFormulaSubItem,
        description: this.selectedServiceNumberRecordSubItem.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newSubItem.amountPerUnit,
        Type: '',
        invoiceSubItemCode: Date.now(),
      };
      if (this.newSubItem.amountPerUnit === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'AmountPerUnit is required',
          life: 3000,
        });
      } else {
        console.log(newRecord);
        const bodyRequest: any = {
          quantity: newRecord.quantity,
          amountPerUnit: newRecord.amountPerUnit,
        };
        this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
          next: async (res) => {
            console.log('subitem with total:', res);
            newRecord.total = res.total;
            const filteredSubItem = Object.fromEntries(
              Object.entries(newRecord).filter(([_, value]) => {
                return (
                  value !== '' &&
                  value !== 0 &&
                  value !== undefined &&
                  value !== null
                );
              })
            );
            console.log(filteredSubItem);
            const success = this.addSubItemToMainItem(
              mainItem.invoiceMainItemCode,
              filteredSubItem as SubItem,
              this.documentNumber
            );
            if (success) {
              this.savedInMemory = true;
              const mainItemIndex = this.mainItemsRecords.findIndex(
                (item) =>
                  item.invoiceMainItemCode === mainItem.invoiceMainItemCode
              );
              if (mainItemIndex > -1) {
                // Check if subitem already exists by comparing invoiceSubItemCode
                const existingSubItem = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.find(
                  (subItem) =>
                    subItem.invoiceSubItemCode ===
                    filteredSubItem['invoiceSubItemCode']
                );
                if (!existingSubItem) {
                  this.mainItemsRecords[mainItemIndex].subItems.push(
                    filteredSubItem as SubItem
                  );
                  console.log(this.mainItemsRecords);
                }
                //else {
                console.log('Duplicate subitem detected; skipping addition.');
                console.log(this.mainItemsRecords);
                ///......
                // Calculate the sum of total values for all subitems
                const totalOfSubItems = this.mainItemsRecords[
                  mainItemIndex
                ].subItems.reduce(
                  (sum, subItem) => sum + (subItem.total || 0),
                  0
                );
                this.mainItemsRecords[mainItemIndex].amountPerUnit =
                  totalOfSubItems;
                console.log(
                  `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
                  this.mainItemsRecords[mainItemIndex].amountPerUnit
                );
                // Recalculate the main item's total, amountPerUnitWithProfit, and totalWithProfit
                const recalculateBodyRequest: any = {
                  quantity: this.mainItemsRecords[mainItemIndex].quantity,
                  amountPerUnit: totalOfSubItems,
                };
                if (
                  this.mainItemsRecords[mainItemIndex].profitMargin &&
                  this.mainItemsRecords[mainItemIndex].profitMargin !== 0
                ) {
                  recalculateBodyRequest.profitMargin =
                    this.mainItemsRecords[mainItemIndex].profitMargin;
                }
                this._ApiService
                  .post<any>(`/total`, recalculateBodyRequest)
                  .subscribe({
                    next: (recalculateRes) => {
                      console.log('Updated main item totals:', recalculateRes);
                      this.mainItemsRecords[mainItemIndex] = {
                        ...this.mainItemsRecords[mainItemIndex],
                        total: recalculateRes.total,
                        amountPerUnitWithProfit:
                          recalculateRes.amountPerUnitWithProfit,
                        totalWithProfit: recalculateRes.totalWithProfit,
                      };
                      console.log(
                        `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                        this.mainItemsRecords[mainItemIndex]
                      );
                      this.updateTotalValueAfterAction();
                      // this.cdr.detectChanges();
                    },
                    error: (err) => {
                      console.error('Failed to recalculate totals:', err);
                    },
                  });
                ///......
                //}
              }
              this.resetNewSubItem();
              this.selectedCurrencySubItem = '';
              this.selectedFormulaRecordSubItem = undefined;
              this.resultAfterTest = undefined;
              this.selectedServiceNumberRecordSubItem = undefined;
              console.log(this.mainItemsRecords);
            }
          },
          error: (err) => {
            console.log(err);
          },
          complete: () => { },
        });
      }
    }
  }
  // Save All Document:
  saveDocument() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to save the document?',
      header: 'Confirm Saving ',
      accept: () => {
        console.log(this.mainItemsRecords);
        const saveRequests = this.mainItemsRecords.map((item) => ({
          refrenceId: this.documentNumber,
          subItems: (item.subItems ?? []).map((subItem) =>
            this.removeProperties(subItem, [
              'invoiceMainItemCode',
              'invoiceSubItemCode',
              'selected',
            ])
          ),
          quantity: item.quantity,
          amountPerUnit: item.amountPerUnit,
          serviceNumberCode: item.serviceNumberCode,
          unitOfMeasurementCode: item.unitOfMeasurementCode,
          currencyCode: item.currencyCode,
          formulaCode: item.formulaCode,
          description: item.description,
          total: item.total,
          profitMargin: item.profitMargin,
          totalWithProfit: item.totalWithProfit,
        }));
        console.log(saveRequests);
        const url = `/mainitems?salesQuotation=${this.documentNumber}&salesQuotationItem=${this.itemNumber}&pricingProcedureStep=20&pricingProcedureCounter=1&customerNumber=${this.customerId}`;
        this._ApiService.post<MainItem[]>(url, saveRequests).subscribe({
          next: (res) => {
            console.log('All main items saved successfully:', res);
            this.mainItemsRecords = res;
            this.updateTotalValueAfterAction();
            const lastRecord = res[res.length - 1];
            // this.totalValue = lastRecord.totalHeader ? lastRecord.totalHeader : 0;
            // this.ngOnInit();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'The Document has been saved successfully',
              life: 3000,
            });
          },
          error: (err) => {
            console.error('Error saving main items:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error saving The Document',
              life: 3000,
            });
          },
          complete: () => {
            // this.ngOnInit();
          },
        });
      },
      reject: () => { },
    });
  }

  // For Edit  MainItem
  clonedMainItem: { [s: number]: MainItem } = {};
  onMainItemEditInit(record: MainItem) {
    this.clonedMainItem[record.invoiceMainItemCode] = { ...record };
  }
  onMainItemEditSave(index: number, record: MainItem) {
    console.log(record);

    const {
      invoiceMainItemCode,
      total,
      totalWithProfit,
      ...mainItemWithoutMainItemCode
    } = record;
    const updatedMainItem = this.removePropertiesFrom(
      mainItemWithoutMainItemCode,
      ['invoiceMainItemCode', 'invoiceSubItemCode']
    );
    console.log(updatedMainItem);

    console.log(this.updateSelectedServiceNumber);
    if (this.updateSelectedServiceNumberRecord) {
      const newRecord: MainItem = {
        ...record, // Copy all properties from the original record
        subItems: (record?.subItems ?? []).map((subItem) =>
          this.removeProperties(subItem, [
            'invoiceMainItemCode',
            'invoiceSubItemCode',
          ])
        ),
        unitOfMeasurementCode:
          this.updateSelectedServiceNumberRecord.unitOfMeasurementCode,
        //this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
      };
      console.log(newRecord);
      //....................
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };

      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...newRecord,
            };
            this.updateTotalValueAfterAction();
          }
          // this.cdr.detectChanges();
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................

      // // Update mainItemsRecords array in the component to reflect the changes
      // const mainItemIndex = this.mainItemsRecords.findIndex(item => item.invoiceMainItemCode === invoiceMainItemCode);
      // if (mainItemIndex > -1) {
      //   // Update the specific MainItem in the array
      //   this.mainItemsRecords[mainItemIndex] = { ...this.mainItemsRecords[mainItemIndex], ...newRecord };
      // }
      // // this.updateSelectedServiceNumberRecord=undefined;
      // // Trigger change detection
      // this.cdr.detectChanges();
      // console.log(this.mainItemsRecords);
    }
    if (
      this.updateSelectedServiceNumberRecord &&
      this.updatedFormulaRecord &&
      this.resultAfterTestUpdate
    ) {
      console.log(record);
      console.log(this.updateSelectedServiceNumberRecord);
      const newRecord: MainItem = {
        ...record,
        subItems: (record?.subItems ?? []).map((subItem) =>
          this.removeProperties(subItem, [
            'invoiceMainItemCode',
            'invoiceSubItemCode',
          ])
        ),
        unitOfMeasurementCode:
          this.updateSelectedServiceNumberRecord.unitOfMeasurementCode,
        // this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);

      //....................
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };

      // Conditionally add profitMargin if it has a non-zero value
      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      // { quantity: newRecord.quantity, amountPerUnit: newRecord.amountPerUnit, profitMargin: newRecord.profitMargin ? newRecord.profitMargin : 0 }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          // this.totalValue = 0;
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;

          // Update mainItemsRecords array in the component to reflect the changes
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            // Update the specific MainItem in the array
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...newRecord,
            };
            this.updateTotalValueAfterAction();
          }
          this.updatedFormulaRecord = undefined;
          this.resultAfterTestUpdate = undefined;
          // Trigger change detection
          //this.cdr.detectChanges();
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................

      // // Update mainItemsRecords array in the component to reflect the changes
      // const mainItemIndex = this.mainItemsRecords.findIndex(item => item.invoiceMainItemCode === invoiceMainItemCode);
      // if (mainItemIndex > -1) {
      //   // Update the specific MainItem in the array
      //   this.mainItemsRecords[mainItemIndex] = { ...this.mainItemsRecords[mainItemIndex], ...newRecord };
      // }
      // this.updatedFormulaRecord = undefined;
      // this.resultAfterTestUpdate = undefined
      // // Trigger change detection
      // this.cdr.detectChanges();
      // console.log(this.mainItemsRecords);
    }
    if (this.updatedFormulaRecord && this.resultAfterTestUpdate) {
      const newRecord: MainItem = {
        ...record,
        subItems: (record?.subItems ?? []).map((subItem) =>
          this.removeProperties(subItem, [
            'invoiceMainItemCode',
            'invoiceSubItemCode',
          ])
        ),
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);

      //....................
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };

      // Conditionally add profitMargin if it has a non-zero value
      if (newRecord.profitMargin && newRecord.profitMargin !== 0) {
        bodyRequest.profitMargin = newRecord.profitMargin;
      }
      // { quantity: newRecord.quantity, amountPerUnit: newRecord.amountPerUnit, profitMargin: newRecord.profitMargin ? newRecord.profitMargin : 0 }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          // this.totalValue = 0;
          newRecord.total = res.total;
          newRecord.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          newRecord.totalWithProfit = res.totalWithProfit;

          // Update mainItemsRecords array in the component to reflect the changes
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            // Update the specific MainItem in the array
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...newRecord,
            };
            this.updateTotalValueAfterAction();
          }
          this.updatedFormulaRecord = undefined;
          this.resultAfterTestUpdate = undefined;
          // Trigger change detection
          //this.cdr.detectChanges();
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................

      // // Update mainItemsRecords array in the component to reflect the changes
      // const mainItemIndex = this.mainItemsRecords.findIndex(item => item.invoiceMainItemCode === invoiceMainItemCode);
      // if (mainItemIndex > -1) {
      //   // Update the specific MainItem in the array
      //   this.mainItemsRecords[mainItemIndex] = { ...this.mainItemsRecords[mainItemIndex], ...newRecord };
      // }
      // this.updatedFormulaRecord = undefined;
      // this.resultAfterTestUpdate = undefined
      // // Trigger change detection
      // this.cdr.detectChanges();
      // console.log(this.mainItemsRecords);
    }
    if (
      !this.updateSelectedServiceNumberRecord &&
      !this.updatedFormulaRecord &&
      !this.resultAfterTestUpdate
    ) {
      console.log({ ...mainItemWithoutMainItemCode });

      //....................
      const bodyRequest: any = {
        quantity: updatedMainItem.quantity,
        amountPerUnit: updatedMainItem.amountPerUnit,
      };
      if (updatedMainItem.profitMargin && updatedMainItem.profitMargin !== 0) {
        bodyRequest.profitMargin = updatedMainItem.profitMargin;
      }
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('mainitem with total:', res);
          updatedMainItem.total = res.total;
          updatedMainItem.amountPerUnitWithProfit = res.amountPerUnitWithProfit;
          updatedMainItem.totalWithProfit = res.totalWithProfit;
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...updatedMainItem,
            };
            this.updateTotalValueAfterAction();
          }
          // this.cdr.detectChanges();
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................

      // // Update mainItemsRecords array in the component to reflect the changes
      // const mainItemIndex = this.mainItemsRecords.findIndex(item => item.invoiceMainItemCode === invoiceMainItemCode);
      // if (mainItemIndex > -1) {
      //   // Update the specific MainItem in the array
      //   this.mainItemsRecords[mainItemIndex] = { ...this.mainItemsRecords[mainItemIndex], ...updatedMainItem };
      // }
      // // Trigger change detection
      // this.cdr.detectChanges();
      // console.log(this.mainItemsRecords);
    }
  }
  onMainItemEditCancel(row: MainItem, index: number) {
    this.mainItemsRecords[index] = this.clonedMainItem[row.invoiceMainItemCode];
    delete this.clonedMainItem[row.invoiceMainItemCode];
  }

  // For Edit  SubItem
  clonedSubItem: { [s: number]: SubItem } = {};
  onSubItemEditInit(record: SubItem, index: number) {
    console.log(index);

    console.log(record);
    console.log('Before reset:', this.clonedSubItem);

    // Ensure invoiceSubItemCode exists
    if (!index) {
      console.error(
        'Error: invoiceSubItemCode is undefined for the record:',
        record
      );
      return; // Stop further execution if key is invalid
    }

    // Clear the clonedSubItem object before adding the new subitem
    this.clonedSubItem = {};
    // this.clonedSubItem = { [index]: { ...record } }; // Force new reference
    // this.cdr.detectChanges(); // Trigger change detection

    console.log('After reset:', this.clonedSubItem);

    console.log(this.clonedSubItem);
    if (record.invoiceSubItemCode) {
      if (!this.clonedSubItem[record.invoiceSubItemCode]) {
        this.clonedSubItem[record.invoiceSubItemCode] = { ...record };
      }
      // this.clonedSubItem[record.invoiceSubItemCode] = { ...record };
    }
    // Reassign to force change detection
    // this.clonedSubItem = { ...this.clonedSubItem };

    console.log('After adding record:', this.clonedSubItem);
  }
  onSubItemEditSave(index: number, record: SubItem, mainItem: MainItem) {
    // Ensure record and mainItem are valid
    if (!record || !record.invoiceSubItemCode) {
      console.error(
        'Error: Invalid SubItem record or missing invoiceSubItemCode:',
        record
      );
      return;
    }
    if (!mainItem) {
      console.error('Error: Invalid MainItem:', mainItem);
      return;
    }
    const id = record.invoiceSubItemCode; // Extract `invoiceSubItemCode` once
    console.log(
      'SubItem Edit Save - Record:',
      record,
      'MainItem:',
      mainItem,
      'Index:',
      index,
      'ID:',
      id
    );
    const clonedRecord = { ...record };

    if (this.updateSelectedServiceNumberRecordSubItem) {
      const newRecord: SubItem = {
        ...clonedRecord,
        unitOfMeasurementCode:
          this.updateSelectedServiceNumberRecordSubItem.unitOfMeasurementCode,
        description: this.updateSelectedServiceNumberRecordSubItem.description,
      };
      console.log('New SubItem Record:', newRecord);
      const bodyRequest = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('API Response - SubItem Total:', res);
          newRecord.total = res.total;
          delete this.clonedSubItem[id];
          // Update MainItem subitems
          const {
            invoiceMainItemCode,
            total,
            totalWithProfit,
            amountPerUnitWithProfit,
            ...mainItemWithoutMainItemCode
          } = mainItem;
          const updatedSubItems = (mainItem?.subItems ?? []).map((subItem) =>
            subItem.invoiceSubItemCode === newRecord.invoiceSubItemCode
              ? { ...subItem, ...newRecord } // Replace the matching subitem
              : subItem
          );
          // Update the MainItem
          const updatedRecord: MainItem = {
            ...mainItemWithoutMainItemCode,
            subItems: updatedSubItems,
            invoiceMainItemCode: 0,
            total: 0,
            totalWithProfit: 0,
          };
          console.log('Updated MainItem Record:', updatedRecord);
          const filteredRecord = Object.fromEntries(
            Object.entries(updatedRecord).filter(
              ([_, value]) =>
                value !== '' &&
                value !== 0 &&
                value !== null &&
                value !== undefined
            )
          );
          console.log('Filtered MainItem Record:', filteredRecord);
          // Update MainItem in `mainItemsRecords`
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...filteredRecord,
            };
            // Recalculate total of all subitems
            const totalOfSubItems = this.mainItemsRecords[
              mainItemIndex
            ].subItems.reduce((sum, subItem) => sum + (subItem.total || 0), 0);
            // Update `amountPerUnit`
            this.mainItemsRecords[mainItemIndex].amountPerUnit =
              totalOfSubItems;
            console.log(
              `Updated AmountPerUnit for MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
              totalOfSubItems
            );
            const recalculateBodyRequest: any = {
              quantity: this.mainItemsRecords[mainItemIndex].quantity,
              amountPerUnit: totalOfSubItems,
            };
            if (
              this.mainItemsRecords[mainItemIndex].profitMargin &&
              this.mainItemsRecords[mainItemIndex].profitMargin !== 0
            ) {
              recalculateBodyRequest.profitMargin =
                this.mainItemsRecords[mainItemIndex].profitMargin;
            }
            this._ApiService
              .post<any>(`/total`, recalculateBodyRequest)
              .subscribe({
                next: (recalculateRes) => {
                  console.log('Recalculated MainItem Totals:', recalculateRes);
                  this.mainItemsRecords[mainItemIndex] = {
                    ...this.mainItemsRecords[mainItemIndex],
                    total: recalculateRes.total,
                    amountPerUnitWithProfit:
                      recalculateRes.amountPerUnitWithProfit,
                    totalWithProfit: recalculateRes.totalWithProfit,
                  };
                  console.log(
                    `Final Updated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                    this.mainItemsRecords[mainItemIndex]
                  );
                  this.updateTotalValueAfterAction();
                },
                error: (err) => {
                  console.error('Failed to recalculate totals:', err);
                },
              });
          }
        },
        error: (err) => {
          console.error('Failed to calculate SubItem total:', err);
        },
      });
    }
    if (
      this.updateSelectedServiceNumberRecordSubItem &&
      this.updatedFormulaRecordSubItem &&
      this.resultAfterTestUpdate
    ) {
      console.log(record);
      console.log(this.updateSelectedServiceNumberRecordSubItem);
      const newRecord: SubItem = {
        ...clonedRecord,
        unitOfMeasurementCode:
          this.updateSelectedServiceNumberRecordSubItem.unitOfMeasurementCode,
        // this.updateSelectedServiceNumberRecordSubItem.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecordSubItem.description,
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);
      //....................
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('subitem with total:', res);
          newRecord.total = res.total;
          delete this.clonedSubItem[id];
          //....
          const {
            invoiceMainItemCode,
            total,
            totalWithProfit,
            amountPerUnitWithProfit,
            ...mainItemWithoutMainItemCode
          } = mainItem;
          const updatedSubItems = (mainItem?.subItems ?? []).map((subItem) =>
            subItem.invoiceSubItemCode === newRecord.invoiceSubItemCode
              ? { ...subItem, ...newRecord } // Replace the matching subitem
              : subItem
          );
          const updatedRecord: MainItem = {
            ...mainItemWithoutMainItemCode,
            subItems: updatedSubItems,
            invoiceMainItemCode: 0,
            totalWithProfit: 0,
            total: 0,
            amountPerUnitWithProfit: 0,
          };
          console.log(updatedRecord);
          const filteredRecord = Object.fromEntries(
            Object.entries(updatedRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          );
          console.log(filteredRecord);
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...filteredRecord,
            };
            // Calculate the total of all subitems
            const totalOfSubItems = this.mainItemsRecords[
              mainItemIndex
            ].subItems.reduce((sum, subItem) => sum + (subItem.total || 0), 0);
            // Update the main item's `amountPerUnit`
            this.mainItemsRecords[mainItemIndex].amountPerUnit =
              totalOfSubItems;
            console.log(
              `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
              this.mainItemsRecords[mainItemIndex].amountPerUnit
            );
            const recalculateBodyRequest: any = {
              quantity: this.mainItemsRecords[mainItemIndex].quantity,
              amountPerUnit: totalOfSubItems,
            };
            if (
              this.mainItemsRecords[mainItemIndex].profitMargin &&
              this.mainItemsRecords[mainItemIndex].profitMargin !== 0
            ) {
              recalculateBodyRequest.profitMargin =
                this.mainItemsRecords[mainItemIndex].profitMargin;
            }
            this._ApiService
              .post<any>(`/total`, recalculateBodyRequest)
              .subscribe({
                next: (recalculateRes) => {
                  console.log('Updated main item totals:', recalculateRes);
                  this.mainItemsRecords[mainItemIndex] = {
                    ...this.mainItemsRecords[mainItemIndex],
                    total: recalculateRes.total,
                    amountPerUnitWithProfit:
                      recalculateRes.amountPerUnitWithProfit,
                    totalWithProfit: recalculateRes.totalWithProfit,
                  };
                  console.log(
                    `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                    this.mainItemsRecords[mainItemIndex]
                  );
                  this.updateTotalValueAfterAction();
                },
                error: (err) => {
                  console.error('Failed to recalculate totals:', err);
                },
              });
            ///....
          }
          this.updateSelectedServiceNumberRecordSubItem = undefined;
          this.updatedFormulaRecordSubItem = undefined;
          this.resultAfterTestUpdate = undefined;
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................
    }
    if (this.updatedFormulaRecordSubItem && this.resultAfterTestUpdate) {
      const newRecord: SubItem = {
        ...clonedRecord,
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);
      const bodyRequest: any = {
        quantity: newRecord.quantity,
        amountPerUnit: newRecord.amountPerUnit,
      };
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('subitem with total:', res);
          newRecord.total = res.total;
          delete this.clonedSubItem[id];
          //...
          const {
            invoiceMainItemCode,
            total,
            totalWithProfit,
            amountPerUnitWithProfit,
            ...mainItemWithoutMainItemCode
          } = mainItem;
          const updatedSubItems = (mainItem?.subItems ?? []).map((subItem) =>
            subItem.invoiceSubItemCode === newRecord.invoiceSubItemCode
              ? { ...subItem, ...newRecord } // Replace the matching subitem
              : subItem
          );
          const updatedRecord: MainItem = {
            ...mainItemWithoutMainItemCode,
            subItems: updatedSubItems,
            invoiceMainItemCode: 0,
            totalWithProfit: 0,
            total: 0,
            amountPerUnitWithProfit: 0,
          };
          console.log(updatedRecord);
          const filteredRecord = Object.fromEntries(
            Object.entries(updatedRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          );
          console.log(filteredRecord);
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            // Update the specific MainItem in the array
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...filteredRecord,
            };
            // Calculate the total of all subitems
            const totalOfSubItems = this.mainItemsRecords[
              mainItemIndex
            ].subItems.reduce((sum, subItem) => sum + (subItem.total || 0), 0);
            // Update the main item's `amountPerUnit`
            this.mainItemsRecords[mainItemIndex].amountPerUnit =
              totalOfSubItems;
            console.log(
              `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
              this.mainItemsRecords[mainItemIndex].amountPerUnit
            );
            const recalculateBodyRequest: any = {
              quantity: this.mainItemsRecords[mainItemIndex].quantity,
              amountPerUnit: totalOfSubItems,
            };
            if (
              this.mainItemsRecords[mainItemIndex].profitMargin &&
              this.mainItemsRecords[mainItemIndex].profitMargin !== 0
            ) {
              recalculateBodyRequest.profitMargin =
                this.mainItemsRecords[mainItemIndex].profitMargin;
            }
            this._ApiService
              .post<any>(`/total`, recalculateBodyRequest)
              .subscribe({
                next: (recalculateRes) => {
                  console.log('Updated main item totals:', recalculateRes);
                  this.mainItemsRecords[mainItemIndex] = {
                    ...this.mainItemsRecords[mainItemIndex],
                    total: recalculateRes.total,
                    amountPerUnitWithProfit:
                      recalculateRes.amountPerUnitWithProfit,
                    totalWithProfit: recalculateRes.totalWithProfit,
                  };
                  console.log(
                    `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                    this.mainItemsRecords[mainItemIndex]
                  );
                  this.updateTotalValueAfterAction();
                },
                error: (err) => {
                  console.error('Failed to recalculate totals:', err);
                },
              });
            ///....
          }
          this.updatedFormulaRecordSubItem = undefined;
          this.resultAfterTestUpdate = undefined;
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................
    }
    if (
      !this.updateSelectedServiceNumberRecordSubItem &&
      !this.updatedFormulaRecordSubItem &&
      !this.resultAfterTestUpdate
    ) {
      const bodyRequest: any = {
        quantity: clonedRecord.quantity,
        amountPerUnit: clonedRecord.amountPerUnit,
      };
      this._ApiService.post<any>(`/total`, bodyRequest).subscribe({
        next: (res) => {
          console.log('subitem with total:', res);
          clonedRecord.total = res.total;
          delete this.clonedSubItem[id];
          const {
            invoiceMainItemCode,
            total,
            totalWithProfit,
            amountPerUnitWithProfit,
            ...mainItemWithoutMainItemCode
          } = mainItem;
          const updatedSubItems = (mainItem?.subItems ?? []).map((subItem) =>
            subItem.invoiceSubItemCode === clonedRecord.invoiceSubItemCode
              ? { ...subItem, ...clonedRecord } // Replace the matching subitem
              : subItem
          );
          const updatedRecord: MainItem = {
            ...mainItemWithoutMainItemCode,
            subItems: updatedSubItems,
            invoiceMainItemCode: 0,
            totalWithProfit: 0,
            total: 0,
            amountPerUnitWithProfit: 0,
          };
          console.log(updatedRecord);
          const filteredRecord = Object.fromEntries(
            Object.entries(updatedRecord).filter(([_, value]) => {
              return (
                value !== '' &&
                value !== 0 &&
                value !== undefined &&
                value !== null
              );
            })
          );
          console.log(filteredRecord);
          const mainItemIndex = this.mainItemsRecords.findIndex(
            (item) => item.invoiceMainItemCode === invoiceMainItemCode
          );
          if (mainItemIndex > -1) {
            // Update the specific MainItem in the array
            this.mainItemsRecords[mainItemIndex] = {
              ...this.mainItemsRecords[mainItemIndex],
              ...filteredRecord,
            };
            // Calculate the total of all subitems
            const totalOfSubItems = this.mainItemsRecords[
              mainItemIndex
            ].subItems.reduce((sum, subItem) => sum + (subItem.total || 0), 0);
            // Update the main item's `amountPerUnit`
            this.mainItemsRecords[mainItemIndex].amountPerUnit =
              totalOfSubItems;
            console.log(
              `Updated MainItem (ID: ${mainItem.invoiceMainItemCode}) AmountPerUnit:`,
              this.mainItemsRecords[mainItemIndex].amountPerUnit
            );
            // Recalculate the main item's total, amountPerUnitWithProfit, and totalWithProfit
            const recalculateBodyRequest: any = {
              quantity: this.mainItemsRecords[mainItemIndex].quantity,
              amountPerUnit: totalOfSubItems,
            };
            if (
              this.mainItemsRecords[mainItemIndex].profitMargin &&
              this.mainItemsRecords[mainItemIndex].profitMargin !== 0
            ) {
              recalculateBodyRequest.profitMargin =
                this.mainItemsRecords[mainItemIndex].profitMargin;
            }
            this._ApiService
              .post<any>(`/total`, recalculateBodyRequest)
              .subscribe({
                next: (recalculateRes) => {
                  console.log('Updated main item totals:', recalculateRes);
                  this.mainItemsRecords[mainItemIndex] = {
                    ...this.mainItemsRecords[mainItemIndex],
                    total: recalculateRes.total,
                    amountPerUnitWithProfit:
                      recalculateRes.amountPerUnitWithProfit,
                    totalWithProfit: recalculateRes.totalWithProfit,
                  };
                  console.log(
                    `Recalculated MainItem (ID: ${mainItem.invoiceMainItemCode}):`,
                    this.mainItemsRecords[mainItemIndex]
                  );
                  this.updateTotalValueAfterAction();
                },
                error: (err) => {
                  console.error('Failed to recalculate totals:', err);
                },
              });
          }
          console.log(this.mainItemsRecords);
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => { },
      });
      ///...................
    }
  }
  onSubItemEditCancel(subItem: any, index: number) {
    const originalItem = this.clonedSubItem[subItem.invoiceSubItemCode];
    if (originalItem) {
      this.mainItemsRecords.forEach((mainItem) => {
        if (mainItem.subItems && mainItem.subItems[index] === subItem) {
          mainItem.subItems[index] = { ...originalItem };
        }
      });
      delete this.clonedSubItem[subItem.invoiceSubItemCode];
    }
  }

  // Delete MainItem || SubItem
  deleteRecord() {
    console.log('delete');
    if (this.selectedTenderingMainItems.length) {
      console.log('Selected MainItems:', this.selectedTenderingMainItems);
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected MainItems?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          console.log('MainItems before deletion:', this.mainItemsRecords);
          console.log('Selected MainItems:', this.selectedTenderingMainItems);
          for (const record of this.selectedTenderingMainItems) {
            console.log(record);
            this.mainItemsRecords = this.mainItemsRecords.filter(item => item.invoiceMainItemCode !== record.invoiceMainItemCode);
            // this.mainItemsRecords = this.mainItemsRecords.filter((item) => {
            //   const isSelected = this.selectedTenderingMainItems.some(
            //     (selected) =>
            //       selected.invoiceMainItemCode === item.invoiceMainItemCode
            //   );
            //   console.log(
            //     `Item ${item.invoiceMainItemCode} is selected: ${isSelected}`
            //   );
            //   return !isSelected;
            // });
            this.mainItemsRecords = [...this.mainItemsRecords];
            console.log('MainItems after deletion:', this.mainItemsRecords);
            this.updateTotalValueAfterAction();
            // this.selectedTenderingMainItems = [];
            this.cdr.detectChanges();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'MainItems deleted.',
              life: 3000,
            });
            this.selectedTenderingMainItems = [];
          }
        },
      });
    }
    if (this.selectedTenderingSubItems.length) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected record?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          for (const record of this.selectedTenderingSubItems) {
            console.log(record);
            if (record.invoiceSubItemCode) {
              for (const mainItem of this.mainItemsRecords) {
                ///..................
                // Find the MainItem that contains the SubItem
                const subItemIndex = mainItem.subItems.findIndex(
                  (subItem) =>
                    subItem.invoiceSubItemCode === record.invoiceSubItemCode
                );
                if (subItemIndex > -1) {
                  // Remove the SubItem from the MainItem's subItems array
                  mainItem.subItems.splice(subItemIndex, 1);
                  // Recalculate the total of all subitems
                  const totalOfSubItems = mainItem.subItems.reduce(
                    (sum, subItem) => sum + (subItem.total || 0),
                    0
                  );
                  // Update the main item's amountPerUnit
                  mainItem.amountPerUnit = totalOfSubItems;
                  const recalculateBodyRequest = {
                    quantity: mainItem.quantity,
                    amountPerUnit: totalOfSubItems,
                  };
                  this._ApiService
                    .post<any>(`/total`, recalculateBodyRequest)
                    .subscribe({
                      next: (recalculateRes) => {
                        console.log(
                          'Updated main item totals after deletion:',
                          recalculateRes
                        );
                        mainItem.total = recalculateRes.total;
                        mainItem.amountPerUnitWithProfit =
                          recalculateRes.amountPerUnitWithProfit;
                        mainItem.totalWithProfit =
                          recalculateRes.totalWithProfit;
                        this.updateTotalValueAfterAction();
                      },
                      error: (err) => {
                        console.error('Failed to recalculate totals:', err);
                      },
                    });
                }
              }
              console.log(this.mainItemsRecords);
            }
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Successfully',
            detail: 'Deleted',
            life: 3000,
          });
          this.selectedTenderingSubItems = [];
        },
      });
    }
  }
  // Helper Functions:
  removePropertiesFrom(obj: any, propertiesToRemove: string[]): any {
    const newObj: any = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          newObj[key] = obj[key].map((item: any) =>
            this.removeProperties(item, propertiesToRemove)
          );
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          newObj[key] = this.removeProperties(obj[key], propertiesToRemove);
        } else if (!propertiesToRemove.includes(key)) {
          newObj[key] = obj[key];
        }
      }
    }
    return newObj;
  }
  removeProperties(obj: any, propertiesToRemove: string[]): any {
    const newObj: any = {};
    Object.keys(obj).forEach((key) => {
      if (!propertiesToRemove.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
  resetNewMainItem() {
    (this.newMainItem = {
      Type: '',
      invoiceMainItemCode: 0,
      serviceNumberCode: 0,
      description: '',
      quantity: 0,
      unitOfMeasurementCode: '',
      formulaCode: '',
      amountPerUnit: 0,
      currencyCode: '',
      total: 0,
      profitMargin: 0,
      totalWithProfit: 0,
      subItems: [],
      isPersisted: false,
    }),
      (this.selectedUnitOfMeasure = '');
    this.selectedFormula = '';
    this.selectedCurrency = '';
    this.selectedServiceNumber = 0;
  }
  resetNewSubItem() {
    (this.newSubItem = {
      Type: '',
      invoiceSubItemCode: 0,
      // invoiceMainItemCode: 0,
      serviceNumberCode: 0,
      description: '',
      quantity: 0,
      unitOfMeasurementCode: '',
      formulaCode: '',
      amountPerUnit: 0,
      currencyCode: '',
      total: 0,
    }),
      (this.selectedUnitOfMeasureSubItem = '');
    this.selectedFormulaSubItem = '';
    this.selectedCurrencySubItem = '';
    this.selectedServiceNumberSubItem = 0;
  }
  // // to handel checkbox selection:
  // selectedMainItems: MainItem[] = [];
  // selectedSubItems: SubItem[] = [];
  // onMainItemSelection(event: any, mainItem: MainItem) {
  //   mainItem.selected = event.checked;
  //   this.selectedMainItems = event.checked
  //   if (mainItem.selected) {
  //     if (mainItem.subItems && mainItem.subItems.length > 0) {
  //       mainItem.subItems.forEach(subItem => subItem.selected = !subItem.selected);
  //     }
  //   }
  //   else {
  //     // User deselected the record, so we need to deselect all associated subitems
  //     if (mainItem.subItems && mainItem.subItems.length > 0) {
  //       mainItem.subItems.forEach(subItem => subItem.selected = false)
  //       console.log(mainItem.subItems);
  //     }
  //   }
  //   // For Profit Margin:
  //   if (event.checked) {
  //     this.selectedRowsForProfit.push(mainItem);
  //     console.log(this.selectedRowsForProfit);
  //   } else {
  //     const index = this.selectedRowsForProfit.indexOf(mainItem);
  //     if (index !== -1) {
  //       this.selectedRowsForProfit.splice(index, 1);
  //       console.log(this.selectedRowsForProfit);
  //     }
  //   }
  // }
  //new selection.....

  selectedMainItems: MainItem[] = [];
  selectedSubItems: SubItem[] = [];

  onMainItemSelection(event: any, mainItem: MainItem) {
    mainItem.selected = event.checked;
    console.log(mainItem.selected);

    if (mainItem.selected) {
      this.selectedMainItems.push(mainItem);
      this.selectedRowsForProfit.push(mainItem); // Add to profit rows
    } else {
      // this.selectedMainItems = this.selectedMainItems.filter(item => item !== mainItem);
      // this.selectedRowsForProfit = this.selectedRowsForProfit.filter(item => item !== mainItem); // Remove from profit rows
      this.selectedMainItems = this.selectedMainItems.filter(
        (item) => item.invoiceMainItemCode !== mainItem.invoiceMainItemCode
      );
      this.selectedRowsForProfit = this.selectedRowsForProfit.filter(
        (item) => item.invoiceMainItemCode !== mainItem.invoiceMainItemCode
      );
    }
    console.log('Selected MainItems:', this.selectedMainItems);
    console.log('Selected SubItems:', this.selectedSubItems);
    console.log('Selected Rows for Profit:', this.selectedRowsForProfit);
  }

  //end new selection...............
  // to handle All Records Selection / Deselection
  selectedAllRecords: MainItem[] = [];
  onSelectAllRecords(event: any): void {
    if (Array.isArray(event.checked) && event.checked.length > 0) {
      this.selectedAllRecords = [...this.mainItemsRecords];
      console.log(this.selectedAllRecords);
    } else {
      this.selectedAllRecords = [];
    }
  }

  onSubItemSelection(event: any, subItem: SubItem) {
    console.log(subItem);
    subItem.selected = event.checked;
    if (subItem.selected) {
      this.selectedSubItems.push(subItem);
    } else {
      this.selectedSubItems = this.selectedSubItems.filter(
        (item) => item !== subItem
      );
    }
    console.log('Selected SubItems:', this.selectedSubItems);
    // this.selectedSubItems.push(subItem);
  }
  //In Creation to handle shortTextChangeAlowlled Flag
  onServiceNumberChange(event: any) {
    const selectedRecord = this.recordsServiceNumber.find(
      (record) => record.serviceNumberCode === this.selectedServiceNumber
    );
    if (selectedRecord) {
      this.selectedServiceNumberRecord = selectedRecord;
      this.shortTextChangeAllowed =
        this.selectedServiceNumberRecord?.shortTextChangeAllowed || false;
      this.shortText = '';
    } else {
      console.log('no service number');
      this.selectedServiceNumberRecord = undefined;
    }
  }
  onServiceNumberChangeForModels(event: any, index: number) {
    const currentItem = this.selectedModelSpecsDetails[index];
    const selectedRecord = this.recordsServiceNumber.find(
      (record) => record.serviceNumberCode === currentItem.serviceNumberCode
    );
    if (selectedRecord) {
      this.selectedServiceNumberRecordForModels = selectedRecord;
      // this.shortTextChangeAllowed =  this.selectedServiceNumberRecord?.shortTextChangeAllowed || false;
      // this.shortText = '';
    } else {
      console.log('no service number');
      this.selectedServiceNumberRecordForModels = undefined;
    }
  }
  onServiceNumberChangeForExcelSheet(event: any, index: number): void {
    const currentItem = this.parsedData[index];
    const selectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === currentItem.serviceNumberCode);
    if (selectedRecord) {
      this.selectedServiceNumberRecordForExcel = selectedRecord
      // this.shortTextChangeAllowed = this.selectedServiceNumberRecord?.shortTextChangeAllowed || false;
      // this.shortText = ""
    }
    else {
      console.log("no service number");
      this.selectedServiceNumberRecordForExcel = undefined;
    }
  }
  //In Update to handle shortTextChangeAlowlled Flag
  onServiceNumberUpdateChange(event: any) {
    const updateSelectedRecord = this.recordsServiceNumber.find(
      (record) => record.serviceNumberCode === event.value
    );
    if (updateSelectedRecord) {
      this.updateSelectedServiceNumberRecord = updateSelectedRecord;
      this.updateShortTextChangeAllowed =
        this.updateSelectedServiceNumberRecord?.shortTextChangeAllowed || false;
      this.updateShortText = '';
    } else {
      this.updateSelectedServiceNumberRecord = undefined;
    }
  }

  //In Creation SubItem to handle shortTextChangeAlowlled Flag
  onServiceNumberChangeSubItem(event: any) {
    const selectedRecord = this.recordsServiceNumber.find(
      (record) => record.serviceNumberCode === this.selectedServiceNumberSubItem
    );
    if (selectedRecord) {
      this.selectedServiceNumberRecordSubItem = selectedRecord;
      this.shortTextChangeAllowedSubItem =
        this.selectedServiceNumberRecordSubItem?.shortTextChangeAllowed ||
        false;
      this.shortTextSubItem = '';
    } else {
      console.log('no service number');
      this.selectedServiceNumberRecordSubItem = undefined;
    }
  }
  //In Update SubItem to handle shortTextChangeAlowlled Flag
  onServiceNumberUpdateChangeSubItem(event: any) {
    const updateSelectedRecord = this.recordsServiceNumber.find(
      (record) => record.serviceNumberCode === event.value
    );
    if (updateSelectedRecord) {
      this.updateSelectedServiceNumberRecordSubItem = updateSelectedRecord;
      this.updateShortTextChangeAllowedSubItem =
        this.updateSelectedServiceNumberRecordSubItem?.shortTextChangeAllowed ||
        false;
      this.updateShortTextSubItem = '';
    } else {
      this.updateSelectedServiceNumberRecordSubItem = undefined;
    }
  }

  onFormulaSelect(event: any) {
    const selectedRecord = this.recordsFormula.find(
      (record) => record.formula === this.selectedFormula
    );
    if (selectedRecord) {
      this.selectedFormulaRecord = selectedRecord;
      console.log(this.selectedFormulaRecord);
    } else {
      console.log('no Formula');
      this.selectedFormulaRecord = undefined;
    }
  }
  onFormulaUpdateSelect(event: any) {
    const selectedRecord = this.recordsFormula.find(
      (record) => record.formula === event.value
    );
    if (selectedRecord) {
      this.updatedFormulaRecord = selectedRecord;
      console.log(this.updatedFormulaRecord);
    } else {
      this.updatedFormulaRecord = undefined;
      console.log(this.updatedFormulaRecord);
    }
  }

  onFormulaSelectSubItem(event: any) {
    const selectedRecord = this.recordsFormula.find(
      (record) => record.formula === this.selectedFormulaSubItem
    );
    if (selectedRecord) {
      this.selectedFormulaRecordSubItem = selectedRecord;
      console.log(this.selectedFormulaRecordSubItem);
    } else {
      console.log('no Formula');
      this.selectedFormulaRecordSubItem = undefined;
    }
  }
  onFormulaUpdateSelectSubItem(event: any) {
    const selectedRecord = this.recordsFormula.find(
      (record) => record.formula === event.value
    );
    if (selectedRecord) {
      this.updatedFormulaRecordSubItem = selectedRecord;
      console.log(this.updatedFormulaRecordSubItem);
    } else {
      this.updatedFormulaRecordSubItem = undefined;
      console.log(this.updatedFormulaRecordSubItem);
    }
  }
  expandAll() {
    this.mainItemsRecords.forEach(
      (item) => (this.expandedRows[item.invoiceMainItemCode] = true)
    );
  }
  collapseAll() {
    this.expandedRows = {};
  }

  // Export to excel sheet:
  transformData(data: MainItem[]) {
    const transformed: MainItem[] = [];

    data.forEach((mainItem) => {
      transformed.push({
        Type: 'Main Item',
        serviceNumberCode: mainItem.serviceNumberCode,
        description: mainItem.description,
        quantity: mainItem.quantity,
        unitOfMeasurementCode: mainItem.unitOfMeasurementCode,
        formulaCode: mainItem.formulaCode,
        amountPerUnit: mainItem.amountPerUnit,
        currencyCode: mainItem.currencyCode,
        total: mainItem.total,
        profitMargin: mainItem.profitMargin,
        totalWithProfit: mainItem.totalWithProfit,
        doNotPrint: mainItem.doNotPrint,
        invoiceMainItemCode: mainItem.invoiceMainItemCode,
        subItems: [],
        isPersisted: false,
      });
      // Add subitems
      mainItem.subItems?.forEach((subItem) => {
        transformed.push({
          Type: 'Sub Item',
          invoiceSubItemCode: subItem.invoiceSubItemCode,
          serviceNumberCode: subItem.serviceNumberCode,
          description: subItem.description,
          quantity: subItem.quantity,
          unitOfMeasurementCode: subItem.unitOfMeasurementCode,
          amountPerUnit: subItem.amountPerUnit,
          formulaCode: subItem.formulaCode,
          currencyCode: subItem.currencyCode,
          total: subItem.total ? subItem.total : 0,

          //profitMargin: mainItem.profitMargin,
          totalWithProfit: 0,
          // doNotPrint: subItem.doNotPrint,
          invoiceMainItemCode: mainItem.invoiceMainItemCode,
          subItems: [],
          isPersisted: false,
        });
      });
    });
    return transformed;
  }
  exportExcel() {
    import('xlsx').then((xlsx) => {
      const transformedData = this.transformData(this.mainItemsRecords);
      const worksheet = xlsx.utils.json_to_sheet(transformedData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const ws = workbook.Sheets.data;
      if (!ws['!ref']) {
        ws['!ref'] = 'A1:Z1000';
      }
      const range = xlsx.utils.decode_range(ws['!ref']);
      let rowStart = 1;
      transformedData.forEach((row, index) => {
        if (row.Type === 'Main Item') {
          if (
            index + 1 < transformedData.length &&
            transformedData[index + 1].Type === 'Sub Item'
          ) {
            ws['!rows'] = ws['!rows'] || [];
            ws['!rows'][index] = { hidden: false };
            ws['!rows'][index + 1] = { hidden: false };
          } else {
            ws['!rows'] = ws['!rows'] || [];
            ws['!rows'][index] = { hidden: false };
          }
        } else {
          ws['!rows'] = ws['!rows'] || [];
          ws['!rows'][index] = { hidden: false };
        }
      });
      const excelBuffer: any = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, 'Tendering BOQ');
    });
  }
  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
    );
  }

  // handle Formula Parameters
  showPopup: boolean = false;
  parameterValues: { [key: string]: number } = {};
  showPopupUpdate: boolean = false;
  parameterValuesUpdate: { [key: string]: number } = {};
  openPopup() {
    if (this.selectedFormulaRecord) {
      this.showPopup = true;
      for (const parameterId of this.selectedFormulaRecord.parameterIds) {
        this.parameterValues[parameterId] = 0;
        console.log(this.parameterValues);
      }
    } else if (this.selectedFormulaRecordSubItem) {
      this.showPopup = true;
      for (const parameterId of this.selectedFormulaRecordSubItem
        .parameterIds) {
        this.parameterValues[parameterId] = 0;
        console.log(this.parameterValues);
      }
    } else {
      this.showPopup = false;
    }
  }
  openPopupUpdate() {
    if (this.updatedFormulaRecord) {
      this.showPopupUpdate = true;
      console.log(this.showPopupUpdate);
      for (const parameterId of this.updatedFormulaRecord.parameterIds) {
        this.parameterValuesUpdate[parameterId] = 0;
        console.log(this.parameterValuesUpdate);
      }
    } else if (this.updatedFormulaRecordSubItem) {
      this.showPopupUpdate = true;
      console.log(this.showPopupUpdate);
      for (const parameterId of this.updatedFormulaRecordSubItem.parameterIds) {
        this.parameterValuesUpdate[parameterId] = 0;
        console.log(this.parameterValuesUpdate);
      }
    } else {
      this.showPopupUpdate = false;
    }
  }
  resultAfterTest?: number;
  resultAfterTestUpdate?: number;
  saveParameters() {
    if (this.selectedFormulaRecord) {
      console.log(this.parameterValues);
      const valuesOnly = Object.values(this.parameterValues).filter(
        (value) => typeof value === 'number'
      ) as number[];
      console.log(valuesOnly);
      console.log(this.resultAfterTest);
      const formulaObject: any = {
        formula: this.selectedFormulaRecord.formula,
        description: this.selectedFormulaRecord.description,
        numberOfParameters: this.selectedFormulaRecord.numberOfParameters,
        parameterIds: this.selectedFormulaRecord.parameterIds,
        parameterDescriptions: this.selectedFormulaRecord.parameterDescriptions,
        formulaLogic: this.selectedFormulaRecord.formulaLogic,
        testParameters: valuesOnly,
      };
      console.log(formulaObject);
      this._ApiService
        .patch<any>(
          'formulas',
          this.selectedFormulaRecord.formulaCode,
          formulaObject
        )
        .subscribe((response: Formula) => {
          console.log('formula updated:', response);
          this.resultAfterTest = response.result;
          console.log(this.resultAfterTest);
        });
      this.showPopup = false;
    }
    if (this.updatedFormulaRecord) {
      console.log(this.parameterValuesUpdate);
      const valuesOnly = Object.values(this.parameterValuesUpdate).filter(
        (value) => typeof value === 'number'
      ) as number[];
      console.log(valuesOnly);
      console.log(this.resultAfterTestUpdate);
      const formulaObject: any = {
        formula: this.updatedFormulaRecord.formula,
        description: this.updatedFormulaRecord.description,
        numberOfParameters: this.updatedFormulaRecord.numberOfParameters,
        parameterIds: this.updatedFormulaRecord.parameterIds,
        parameterDescriptions: this.updatedFormulaRecord.parameterDescriptions,
        formulaLogic: this.updatedFormulaRecord.formulaLogic,
        testParameters: valuesOnly,
      };
      console.log(formulaObject);
      this._ApiService
        .put<any>(
          'formulas',
          this.updatedFormulaRecord.formulaCode,
          formulaObject
        )
        .subscribe((response: Formula) => {
          console.log('formula updated:', response);
          this.resultAfterTestUpdate = response.result;
          console.log(this.resultAfterTestUpdate);
        });
      this.showPopupUpdate = false;
    }
    if (this.selectedFormulaRecordSubItem) {
      console.log(this.parameterValues);
      const valuesOnly = Object.values(this.parameterValues).filter(
        (value) => typeof value === 'number'
      ) as number[];
      console.log(valuesOnly);
      console.log(this.resultAfterTest);

      const formulaObject: any = {
        formula: this.selectedFormulaRecordSubItem.formula,
        description: this.selectedFormulaRecordSubItem.description,
        numberOfParameters:
          this.selectedFormulaRecordSubItem.numberOfParameters,
        parameterIds: this.selectedFormulaRecordSubItem.parameterIds,
        parameterDescriptions:
          this.selectedFormulaRecordSubItem.parameterDescriptions,
        formulaLogic: this.selectedFormulaRecordSubItem.formulaLogic,
        testParameters: valuesOnly,
      };
      console.log(formulaObject);
      this._ApiService
        .patch<any>(
          'formulas',
          this.selectedFormulaRecordSubItem.formulaCode,
          formulaObject
        )
        .subscribe((response: Formula) => {
          console.log('formula updated:', response);
          this.resultAfterTest = response.result;
          console.log(this.resultAfterTest);
        });
      this.showPopup = false;
    }
    if (this.updatedFormulaRecordSubItem) {
      console.log(this.parameterValuesUpdate);
      const valuesOnly = Object.values(this.parameterValuesUpdate).filter(
        (value) => typeof value === 'number'
      ) as number[];
      console.log(valuesOnly);
      console.log(this.resultAfterTestUpdate);
      const formulaObject: any = {
        formula: this.updatedFormulaRecordSubItem.formula,
        description: this.updatedFormulaRecordSubItem.description,
        numberOfParameters: this.updatedFormulaRecordSubItem.numberOfParameters,
        parameterIds: this.updatedFormulaRecordSubItem.parameterIds,
        parameterDescriptions:
          this.updatedFormulaRecordSubItem.parameterDescriptions,
        formulaLogic: this.updatedFormulaRecordSubItem.formulaLogic,
        testParameters: valuesOnly,
      };
      console.log(formulaObject);
      this._ApiService
        .put<any>(
          'formulas',
          this.updatedFormulaRecordSubItem.formulaCode,
          formulaObject
        )
        .subscribe((response: Formula) => {
          console.log('formula updated:', response);
          this.resultAfterTestUpdate = response.result;
          console.log(this.resultAfterTestUpdate);
        });
      this.showPopupUpdate = false;
    }
  }
  closePopup() {
    this.showPopupUpdate = false;
    this.showPopup = false;
  }

  // Memory Operations:
  addMainItem(item: MainItem) {
    item.invoiceMainItemCode = Date.now();
    item.isUpdated = true;
    this.mainItemsRecords.push(item);
    console.log(this.mainItemsRecords);
  }
  // Add a SubItem to a specific MainItem by ID
  addSubItemToMainItem(
    mainItemId: number,
    subItem: SubItem,
    documentNumber: number
  ): boolean {
    try {
      let mainItem = this.mainItemsRecords.find(
        (item) => item.invoiceMainItemCode === mainItemId
      );
      if (mainItem) {
        subItem.invoiceMainItemCode = mainItemId;
        mainItem.subItems.push(subItem);
        console.log(
          `SubItem added to MainItem with ID: ${mainItemId}`,
          mainItem
        );
        mainItem.isUpdated = true;
        console.log(mainItem);
        return true;
      } else {
        console.error(`MainItem with ID: ${mainItemId} not found.`);
        return false;
      }
    } catch (error) {
      console.error('Error while adding SubItem:', error);
      return false;
    }
  }
}
