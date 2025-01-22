export class ModelEntity {
    public modelSpecCode!: number;
    public modelSpecDetailsCode: number[]= [];
    public currencyCode:number;
    public modelServSpec: string;
    public blockingIndicator: boolean;
    public serviceSelection: boolean;
    public description: string;
    public searchTerm: string;
   
    constructor(currencyCode:number,modelServSpec: string,blockingIndicator: boolean,serviceSelection: boolean,
        description: string,searchTerm: string
    ) {
       this.currencyCode = currencyCode;
      this.modelServSpec=modelServSpec;
      this.blockingIndicator=blockingIndicator;
      this.serviceSelection=serviceSelection; 
      this.description=description;
      this.searchTerm=searchTerm;
    }
}


export class ModelSpecDetails {
    public modelSpecDetailsCode!: number;
    public serviceNumberCode: number;
    public lineTypeCode: string;
    public unitOfMeasurementCode: string;
    public currencyCode: string;
    public personnelNumberCode: string;
    public serviceTypeCode: string;
    public materialGroupCode: string;
    public formulaCode: string;
    public selectionCheckbox!: boolean;
    public lineIndex!: number;
    public deletionIndicator: boolean;
    public shortText: string;
    public quantity: number;
    public grossPrice:number;
    public overFulfilmentPercentage:number;
    public priceChangedAllowed: boolean;
    public unlimitedOverFulfillment:boolean;
    public pricePerUnitOfMeasurement:number;
    public externalServiceNumber: string;
    public netValue:number;
    public serviceText: string;
    public lineText: string;
    public lineNumber: string;
    public alternatives: string;
    public biddersLine:boolean;
    public supplementaryLine:boolean;
    public lotSizeForCostingIsOne:boolean;

    //extra:
    manualPriceEntryAllowed?: boolean;
    actualQuantity?: number;
    actualPercentage?: number;

    profitMargin?: number;
    totalWithProfit: number=0;
    

    constructor(serviceNumberCode: number,lineTypeCode: string,unitOfMeasurementCode: string,currencyCode: string,
        personnelNumberCode: string,serviceTypeCode: string,materialGroupCode: string,formulaCode: string,
        deletionIndicator: boolean,shortText: string,
        quantity: number,grossPrice:number,overFulfilmentPercentage:number,priceChangedAllowed: boolean,
        unlimitedOverFulfillment:boolean,pricePerUnitOfMeasurement:number,externalServiceNumber: string,
        netValue:number,serviceText: string,lineText: string, lineNumber: string,
        alternatives: string,biddersLine:boolean,supplementaryLine:boolean,lotSizeForCostingIsOne:boolean
    ) {
       this.serviceNumberCode=serviceNumberCode;
       this.lineTypeCode=lineTypeCode;
       this.unitOfMeasurementCode=unitOfMeasurementCode;
       this.currencyCode=currencyCode;
       this.personnelNumberCode = personnelNumberCode; 
       this.serviceTypeCode=serviceTypeCode;
       this.materialGroupCode=materialGroupCode;
       this.formulaCode=formulaCode;

      this.deletionIndicator=deletionIndicator; 
      this.shortText=shortText;
      this.quantity=quantity;
      this.grossPrice=grossPrice;
      this.overFulfilmentPercentage=overFulfilmentPercentage;
      this.priceChangedAllowed=priceChangedAllowed;
      this.unlimitedOverFulfillment=unlimitedOverFulfillment;
      this.pricePerUnitOfMeasurement=pricePerUnitOfMeasurement;
      this.externalServiceNumber=externalServiceNumber;
      this.netValue=netValue;
      this.serviceText=serviceText;
      this.lineText=lineText;
      this.lineNumber=lineNumber;
      this.alternatives=alternatives;
      this.biddersLine=biddersLine; 
      this.supplementaryLine=supplementaryLine;
      this.lotSizeForCostingIsOne=lotSizeForCostingIsOne;
    }
}