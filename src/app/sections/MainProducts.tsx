import Link from "next/link";

export const MainProducts = () => {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden -mt-20 pt-20">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          SURVIVAL
          <span className="text-orange-500 block">READY</span>
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
          Professional survival kits designed for 24h and 72h emergency
          situations. Be prepared for anything.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Link
            href="/products/24h-survival-backpack"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Shop 24H Kit
          </Link>
          <Link
            href="/products/72h-survival-backpack"
            className="border-2 border-white text-white hover:bg-white hover:text-slate-900 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
          >
            Shop 72H Kit
          </Link>
        </div>

        <div className="mt-12 flex justify-center items-center text-gray-400">
          <div className="text-center">
            <p className="text-sm mb-2">Trusted by professionals</p>
            <div className="flex items-center gap-4">
              <span className="text-orange-500 font-bold">★★★★★</span>
              <span className="text-sm">5.0 Rating • 2,500+ Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};
