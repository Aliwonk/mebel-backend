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
  name?: string;
  price?: number;
  description?: string;
  catalog_id?: number;
  category_id?: number;
  manufacturer_id?: number;
  telegram_notification?: boolean;
  dimensions?: {
    lenght: number;
    width: number;
    height: number;
    depth: number;
    weight: number;
  };
  catalog?: string;
  category?: string;
  manufacturer?: string;
  images_to_delete?: string;
}
