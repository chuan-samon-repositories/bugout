import { ProductDTO } from "../product/ProductDTOI";

export interface CartItemDTO {
  product: ProductDTO;
  quantity: number;
}
