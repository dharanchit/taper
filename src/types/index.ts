export interface TickerAddress {
     [key: string]: string
};

export interface CachingType {
     value: 'in-memory' | 'disk';
}

export enum StatusEnum {
     COMPLETED='COMPLETED', 
     STARTED='STARTED',
     INIT='INIT'
};
