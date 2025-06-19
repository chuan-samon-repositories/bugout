export const Footer = () => {
  return (
    <footer className="grid grid-cols-3 w-full md:p-4 lg:p-10 bg-foreground text-background">
      <div className="flex flex-col">
        <div className="text-xl">Seccions</div>
        <div className="flex flex-col p-2">
          <div>Productes</div>
          <div className="flex flex-col p-2">
            <div>Motxilla 72h</div>
            <div>Motxilla 24h</div>
            <div>Motxilla custom</div>
          </div>
          <div>Sales</div>
          <div>Blog</div>
        </div>
      </div>
      <div>
        <p className="text-center text-sm">
          © {new Date().getFullYear()} Bugout. All rights reserved.
        </p>
      </div>
      <div className="flex flex-row">
        <div className="flex-1" />
        <div className="flex flex-col">
          <div className="text-xl">Segueix-nos!</div>
          <div className="flex flex-col p-2">
            <div>Instagram</div>
            <div>Meta</div>
            <div>X</div>
            <div>TikTok</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
