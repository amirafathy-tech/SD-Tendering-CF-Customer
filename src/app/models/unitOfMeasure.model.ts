export class UnitOfMeasure {
  // public unitOfMeasurementCode!:number;
  //   public code: string;
  //   public description: string;

  //   constructor(code:string,description: string
  //   ) {
  //       this.code = code;
  //     this.description=description;
  //   }
  public UnitOfMeasureSAPCode: string;
  public UnitOfMeasureLongName: string;
  public UnitOfMeasureName: string;

  constructor(UnitOfMeasureSAPCode: string, UnitOfMeasureLongName: string, UnitOfMeasureName: string) {
    this.UnitOfMeasureSAPCode = UnitOfMeasureSAPCode;
    this.UnitOfMeasureLongName = UnitOfMeasureLongName;
    this.UnitOfMeasureName = UnitOfMeasureName;
  }
}