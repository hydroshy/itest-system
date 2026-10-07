export declare class OdooOrderLineDto {
    id?: number;
    name?: string;
    product_id?: [number, string] | any;
    default_code?: string;
    product_uom_qty?: number;
    item_code?: string;
    firmware_version?: string;
    notes?: string;
}
export declare class OdooImportDto {
    id?: number;
    name: string;
    partner_id?: [number, string] | string;
    date_order?: string;
    state?: string;
    order_line: OdooOrderLineDto[];
}
