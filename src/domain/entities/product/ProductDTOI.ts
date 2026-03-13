export interface ProductDTO {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  description: string;
  category: string;
  inStock: boolean;
  badge: string | null;
}
