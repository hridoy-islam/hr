export interface PayrollRecord {
 userId: string;
  fromDate?: Date;
  toDate?: Date;
  status:string;
  reason:string;
  approvedBy?:string,
  netAmount:number,
}

