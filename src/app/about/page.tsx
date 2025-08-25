import Link from "next/link";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Marcus Chen",
      role: "Founder & CEO",
      image: "👨‍💼",
      bio: "Former military survival instructor with 15+ years of experience in emergency preparedness training.",
    },
    {
      name: "Sarah Rodriguez",
      role: "Head of Product",
      image: "👩‍🔬",
      bio: "Outdoor gear specialist and mountaineering expert who tests every product in real-world conditions.",
    },
    {
      name: "David Kim",
      role: "Operations Director",
      image: "👨‍🏭",
      bio: "Supply chain expert ensuring the highest quality standards and reliable product availability.",
    },
    {
      name: "Emily Johnson",
      role: "Customer Success",
      image: "👩‍💻",
      bio: "Dedicated to helping customers find the perfect survival solutions for their specific needs.",
    },
  ];

  const milestones = [
    {
      year: "2018",
      title: "Company Founded",
      description:
        "Started with a mission to make professional survival gear accessible to everyone.",
    },
    {
      year: "2019",
      title: "First Product Launch",
      description:
        "Introduced our flagship 72H Survival Backpack after 18 months of development.",
    },
    {
      year: "2021",
      title: "10,000 Customers",
      description:
        "Reached our first major milestone helping families and professionals stay prepared.",
    },
    {
      year: "2023",
      title: "International Expansion",
      description:
        "Expanded shipping to 25+ countries, bringing preparedness solutions worldwide.",
    },
    {
      year: "2024",
      title: "Award Recognition",
      description:
        "Named 'Best Emergency Preparedness Brand' by Outdoor Survival Magazine.",
    },
  ];

  const values = [
    {
      icon: "🛡️",
      title: "Quality First",
      description:
        "Every product undergoes rigorous testing in real emergency conditions before reaching our customers.",
    },
    {
      icon: "🌍",
      title: "Global Impact",
      description:
        "We believe preparedness should be accessible worldwide, regardless of location or experience level.",
    },
    {
      icon: "📚",
      title: "Education Focus",
      description:
        "Beyond products, we provide comprehensive survival education and training resources.",
    },
    {
      icon: "🤝",
      title: "Community Driven",
      description:
        "Our products are developed with input from survival experts, first responders, and customers.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link
          href="/"
          className="hover:text-orange-600 transition-colors duration-200"
        >
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">About Us</span>
      </nav>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          About <span className="text-orange-500">BUGOUT</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          We&apos;re on a mission to make professional-grade survival gear
          accessible to everyone, ensuring you&apos;re prepared for whatever
          life throws your way.
        </p>
      </div>

      {/* Company Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              BUGOUT was born from a simple realization: in an unpredictable
              world, being prepared shouldn&apos;t be a luxury available only to
              survival experts. Our founder, Marcus Chen, witnessed firsthand
              how proper preparation could mean the difference between life and
              death during his military service.
            </p>
            <p>
              After transitioning to civilian life, Marcus was shocked by the
              lack of accessible, high-quality survival gear for everyday
              people. Most products were either overpriced military surplus or
              cheap alternatives that would fail when needed most.
            </p>
            <p>
              That&apos;s when BUGOUT was born. We set out to create survival
              kits that combine military-grade reliability with civilian
              practicality, all at prices that don&apos;t break the bank. Every
              product we design is tested by our team in real-world emergency
              scenarios.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-lg leading-relaxed mb-6">
              To empower individuals and families with the confidence,
              knowledge, and tools they need to face any emergency situation
              with preparedness and resilience.
            </p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">25,000+</div>
                <div className="text-sm opacity-90">Customers Served</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.2%</div>
                <div className="text-sm opacity-90">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Our Journey
        </h2>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-orange-200"></div>
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index % 2 === 0 ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`w-full max-w-md ${
                    index % 2 === 0 ? "mr-auto pr-8" : "ml-auto pl-8"
                  }`}
                >
                  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 relative">
                    <div
                      className={`absolute top-6 w-4 h-4 bg-orange-500 rounded-full ${
                        index % 2 === 0 ? "-right-10" : "-left-10"
                      }`}
                    ></div>
                    <div className="text-orange-600 font-bold text-lg mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Meet Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-6xl mb-4">{member.image}</div>
              <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-orange-600 font-medium mb-3">{member.role}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications & Partnerships */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Certifications & Partners
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl mb-2">🏆</div>
            <h4 className="font-medium text-gray-900">ISO 9001</h4>
            <p className="text-sm text-gray-600">Quality Management</p>
          </div>
          <div>
            <div className="text-4xl mb-2">🛡️</div>
            <h4 className="font-medium text-gray-900">Military Grade</h4>
            <p className="text-sm text-gray-600">MIL-STD Certified</p>
          </div>
          <div>
            <div className="text-4xl mb-2">🌿</div>
            <h4 className="font-medium text-gray-900">Eco Friendly</h4>
            <p className="text-sm text-gray-600">Sustainable Materials</p>
          </div>
          <div>
            <div className="text-4xl mb-2">🚁</div>
            <h4 className="font-medium text-gray-900">First Responder</h4>
            <p className="text-sm text-gray-600">Approved Equipment</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-slate-900 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Prepared?</h2>
        <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
          Join thousands of prepared individuals who trust BUGOUT for their
          emergency preparedness needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Shop Now
          </Link>
          <Link
            href="/contact"
            className="border-2 border-white text-white hover:bg-white hover:text-slate-900 font-bold py-3 px-8 rounded-lg transition-all duration-300"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
