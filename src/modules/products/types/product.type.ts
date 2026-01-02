export interface ProductCatalogInterface {
  name: string;
}

export interface ProductCategoryInterface {
  name: string;
}

export interface ProductManufacturerInterface {
  name: string;
}

export interface ProductDimensionInterface {
  length: number;
  width: number;
  height: number;
  depth: number;
}

export interface ProductRequestInterface {
  name: string;
  price: number;
  description: string;
  catalog_id: number | undefined;
  catalog: any;
  category_id: number | undefined;
  category: any;
  manufacturer_id: number | undefined;
  manufacturer: any;
  dimensions: ProductDimensionInterface;
  telegram_notification: boolean;
}
