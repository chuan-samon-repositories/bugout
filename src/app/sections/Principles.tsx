export const Principles = () => {
  return (
    <section className="flex flex-col w-full min-h-20 my-10 p-8">
      <div className="p-4 text-2xl">Nuestros principios</div>
      <div className="grid grid-cols-3">
        <Principle
          title="Supervivencia para todos"
          description="En Bugout sabemos que no todo el mundo tiene conocimientos de supervivencia..."
        />
        <Principle
          title="Estilo ante todo"
          description="Sabemos lo importante que es para todos mantener el estilo..."
        />
        <Principle
          title="Accesibilidad y educación"
          description="Creemos que la supervivencia no debería ser un lujo..."
        />
      </div>
    </section>
  );
};

interface PrincipleProps {
  title: string;
  description: string;
}

const Principle = ({ title, description }: PrincipleProps) => {
  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
};
