export const Decorator = () => {
  return (
    <section className="w-full py-16 bg-gradient-to-r from-gray-100 to-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors duration-300">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
              Professional Quality
            </h3>
            <p className="text-gray-600">
              Military-grade equipment tested in extreme conditions
            </p>
          </div>

          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors duration-300">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
              24/7 Ready
            </h3>
            <p className="text-gray-600">
              Complete kits ready for immediate deployment
            </p>
          </div>

          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors duration-300">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
              Fast Delivery
            </h3>
            <p className="text-gray-600">
              Emergency shipping available worldwide
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <span className="text-2xl font-bold text-orange-500 mr-2">
              BUGOUT
            </span>
            <span className="text-gray-600">Your Survival Partner</span>
          </div>
        </div>
      </div>
    </section>
  );
};
