import { Feature } from '../../types';

const leftFeatures: Feature[] = [
  {
    title: "Pure & Natural",
    description: "Sourced directly from local farms in and around Kannauj, ensuring purity."
  },
  {
    title: "Aged to Perfection",
    description: "Our attars are aged for months, sometimes years, to develop a rich and complex character."
  },
  {
    title: "Traditional Craft",
    description: "Handcrafted using the ancient deg-bhapka (hydro-distillation) technique."
  }
];

const rightFeatures: Feature[] = [
    {
      title: "Alcohol-Free",
      description: "Experience pure, oil-based fragrances that are gentle and nourishing for the skin."
    },
    {
      title: "Evolving Scent",
      description: "Our attars evolve with your body's warmth, creating a unique personal fragrance."
    },
    {
      title: "A Scent with a Story",
      description: "Each bottle holds not just a fragrance, but the heritage of Kannauj."
    }
  ];

const FeaturesSection = () => {
  return (
    <section id="process" className="py-16 sm:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-12">
          <div className="space-y-12 text-center lg:text-right">
            {leftFeatures.map((feature) => (
              <div key={feature.title}>
                <h4 className="text-2xl font-light tracking-widest">{feature.title}</h4>
                <p className="mt-2 text-foreground max-w-xs mx-auto lg:ml-auto lg:mr-0">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="relative flex justify-center">
            <img 
              src="https://res.cloudinary.com/dnyksrvqu/image/upload/v1768249370/products/temp/jorha93rrzwd2ef0o73o.png"
              alt="Woman applying traditional attar"
              className="max-w-full h-auto"
            />
          </div>

          <div className="space-y-12 text-center lg:text-left">
            {rightFeatures.map((feature) => (
              <div key={feature.title}>
                <h4 className="text-2xl font-light tracking-widest">{feature.title}</h4>
                <p className="mt-2 text-foreground max-w-xs mx-auto lg:mx-0">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
