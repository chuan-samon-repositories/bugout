"use client";

import { useCart } from "../../../context/cart/CartContext";
import { ProductImage } from "../components/ProductImage";

export default function ProductPage({
  params,
}: {
  params: { productName: string };
}) {
  const { productName } = params;
  const { dispatch } = useCart();

  const addToCart = (productName: string) => {
    console.log(`Adding product ${productName} to cart`);
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: productName,
        name: `${productName}`,
        price: 100, // Example price, you can modify this as needed
        quantity: 1, // Default quantity
      },
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
        <ProductImage productId={productName} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          flex: 1,
        }}
      >
        <h1 className="text-2xl font-bold">{productName}</h1>
        <p className="text-lg">
          Esto sería una descripción detallada del producto {productName}.
        </p>
        <button
          onClick={() => addToCart(productName)}
          style={{
            marginTop: "20px",
            backgroundColor: "green",
            color: "white",
            cursor: "pointer",
            width: "fit-content",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          ¡Compra ahora!
        </button>
      </div>
    </div>
  );
}
