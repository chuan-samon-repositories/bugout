export const Header = () => {
  return (
    <div>
      <nav className="w-full fixed grid grid-cols-3 py-6 shadow-md top-0 bg-background">
        <HeaderSections>
          <p>Mochilas</p>
          <p className="font-bold text-red-500">SALE</p>
        </HeaderSections>
        <h1 className="flex justify-center text-2xl">BUGOUT</h1>
        <HeaderSections>
          <div className="flex-1" />
          <p>About us</p>
          <p className="font-bold">CART</p>
        </HeaderSections>
      </nav>
    </div>
  );
};

const HeaderSections = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex flex-row mx-4 *:pt-1 *:mx-4 *:cursor-pointer">
      {children}
    </div>
  );
};
