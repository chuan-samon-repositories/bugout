interface ProductProps {
  productName: string;
  backgroundColor: string;
}

export const Product = ({ productName, backgroundColor }: ProductProps) => {
  return (
    <div
      className="flex flex-1 justify-center items-top m-5 p-15 text-white font-bold"
      style={{ backgroundColor }}
    >
      {productName}
    </div>
  );
};
