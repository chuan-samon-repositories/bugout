export const Newsletter = () => {
  return (
    <section className="flex flex-col justify-center items-center w-full min-h-50 bg-[#cdcac3]">
      <div className="text-2xl">Suscriute a la nostra Newsletter!</div>
      <div className="flex flex-row items-center my-4">
        <input className="bg-background p-2 mx-3" />
        <div className="bg-foreground p-2 text-background cursor-pointer">
          Confirma
        </div>
      </div>
    </section>
  );
};
