import Link from "next/link";

export const ProductShowcase = () => {
  const kitItems = [
    {
      name: "Emergency Food Rations",
      description: "3-day supply, 2400 calories/day",
      image: "🥫",
    },
    {
      name: "Water Purification Tablets",
      description: "Purifies up to 25L of water",
      image: "💧",
    },
    {
      name: "Multi-tool Knife",
      description: "15-in-1 survival tool",
      image: "🔪",
    },
    {
      name: "Emergency Fire Starter",
      description: "Waterproof magnesium fire starter",
      image: "🔥",
    },
  ];

  return (
    <section className="w-full py-20 bg-[#EEE8CE]/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#243C58] mb-4">
            72-Hour Survival Kit
          </h2>
          <p className="text-xl text-[#243C58]/70 max-w-2xl mx-auto">
            Everything you need to survive for 3 days in any emergency
            situation. Professional-grade equipment in one compact backpack.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Main Kit */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="bg-gradient-to-br from-[#243C58] to-[#1a2d42] rounded-2xl p-8 shadow-2xl max-w-md group-hover:shadow-3xl transition-all duration-300 transform group-hover:scale-105">
                <div className="text-center text-white">
                  <div className="w-48 h-48 mx-auto mb-6 bg-gradient-to-br from-[#FF780C] to-[#e66b0a] rounded-xl flex items-center justify-center group-hover:from-[#e66b0a] group-hover:to-[#d45a09] transition-all duration-300">
                    <span className="text-6xl">🎒</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    72H Survival Backpack
                  </h3>
                  <p className="text-[#EEE8CE] mb-4">
                    Complete emergency preparedness kit
                  </p>
                  <div className="text-3xl font-bold text-[#FF780C] mb-6">
                    $299
                  </div>
                  <Link
                    href="/products/72h-survival-backpack"
                    className="block bg-[#FF780C] hover:bg-[#e66b0a] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {/* Badge */}
              <div className="absolute -top-4 -right-4 bg-[#FF780C] text-white font-bold px-3 py-1 rounded-full text-sm animate-pulse">
                BESTSELLER
              </div>
            </div>
          </div>

          {/* Kit Contents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kitItems.map((item, index) => (
              <div
                key={index}
                className="bg-[#EEE8CE]/30 rounded-xl p-6 border border-[#EEE8CE] hover:shadow-lg transition-all duration-300 hover:border-[#FF780C] group cursor-pointer"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.image}
                </div>
                <h4 className="font-bold text-[#243C58] mb-2 group-hover:text-[#FF780C] transition-colors duration-300">
                  {item.name}
                </h4>
                <p className="text-[#243C58]/70 text-sm">{item.description}</p>
              </div>
            ))}

            {/* Additional items indicator */}
            <div className="bg-gradient-to-br from-[#FF780C] to-[#e66b0a] rounded-xl p-6 text-white text-center sm:col-span-2 hover:from-[#e66b0a] hover:to-[#d45a09] transition-all duration-300 cursor-pointer group">
              <div className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">
                +15 More Items
              </div>
              <p className="text-sm opacity-90">
                First aid kit, shelter, tools, and more essential gear
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
