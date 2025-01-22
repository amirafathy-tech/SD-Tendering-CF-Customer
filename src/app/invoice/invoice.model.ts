
export class SubItem {

    Type:string='';

    invoiceSubItemCode: number=0;

    invoiceMainItemCode?: number;

    serviceNumberCode?: number;
    description?: string;
    quantity?: number;
    unitOfMeasurementCode?:string;
    formulaCode?:string;
    amountPerUnit?: number;
    currencyCode?: string;
    total?: number;
    selected?: boolean;

   
}

export class MainItem {

    Type:string='';

    isPersisted: boolean=false;

    temporaryDeletion?:string;
    referenceId?:number;

    invoiceMainItemCode: number=0;
    serviceNumberCode?: number;
    description?: string;
    quantity?: number;
    unitOfMeasurementCode?:string;
    formulaCode?:string;
    amountPerUnit?: number;
    currencyCode?: string;
    total: number=0;
    profitMargin?: number;
    totalWithProfit: number=0;
    selected?: boolean;
    // subItems?:SubItem[];
    subItems: SubItem[] = [];

    totalHeader?:number;
    
    doNotPrint?:boolean;
    amountPerUnitWithProfit?: number;

    isUpdated?: boolean; // New flag for memory-updated items

    salesQuotationItemText?:string;
    
}