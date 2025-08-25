export const Principles = () => {
  const principles = [
    {
      icon: "🛡️",
      title: "Survival for Everyone",
      description:
        "We believe everyone deserves access to quality survival gear, regardless of their experience level. Our kits are designed for both beginners and experts.",
    },
    {
      icon: "⚡",
      title: "Performance First",
      description:
        "Every item in our kits is tested in real emergency situations. We never compromise on quality when lives could depend on our gear.",
    },
    {
      icon: "🌍",
      title: "Sustainable Preparedness",
      description:
        "We&apos;re committed to environmental responsibility while keeping you prepared. Our gear is built to last and reduce waste through durability.",
    },
  ];

  return (
    <section className="w-full py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Our Principles
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            At BUGOUT, we&apos;re driven by core values that guide everything we
            do. From product selection to customer service, these principles
            define who we are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {principles.map((principle, index) => (
            <Principle
              key={index}
              icon={principle.icon}
              title={principle.title}
              description={principle.description}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto hover:shadow-xl transition-shadow duration-300 group">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-orange-600 transition-colors duration-300">
              Our Mission
            </h3>
            <p className="text-gray-600 leading-relaxed">
              To empower individuals and families with the confidence and tools
              they need to face any emergency. We&apos;re not just selling gear
              – we&apos;re building a community of prepared, resilient people
              who can protect themselves and help others when it matters most.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface PrincipleProps {
  icon: string;
  title: string;
  description: string;
}

const Principle = ({ icon, title, description }: PrincipleProps) => {
  return (
    <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 group cursor-pointer">
      <div className="text-center">
        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-orange-600 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
