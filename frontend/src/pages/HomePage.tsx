import Hero from '../components/sections/Hero';
import ArtOfPerfumerySection from '../components/sections/ArtOfPerfumerySection';
import FeaturesSection from '../components/sections/FeaturesSection';
import CustomSmellSection from '../components/sections/CustomSmellSection';
import Testimonials from '../components/sections/Testimonials';
import ServicesSection from '../components/sections/ServicesSection';
import FaqSection from '../components/sections/FaqSection';
import InstagramSection from '../components/sections/InstagramSection';
import ProductShowcase from '../components/sections/ProductShowcase';
import FeaturedProduct from '../components/sections/FeaturedProduct';
import { useEffect, useState } from 'react';
import { apiGetProducts } from '../lib/api';
import { Product } from '../types';

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGetProducts();
        const items = res?.products || [];
        const mapped: Product[] = items.map((p: any) => ({
          id: p.product_id,
          name: p.product_name,
          type: p.product_type === 'attar' ? 'Attar' : 'Perfume',
          price: p.price ? `₹${p.price}` : (p.variants && p.variants[0] ? `₹${p.variants[0].price}` : '₹0'),
          originalPrice: undefined,
          imageUrl: (p.media && p.media[0] && p.media[0].src) || '/placeholder.png',
          categories: p.categories || [],
          category: p.category,
          product_type: p.product_type,
          shortDescription: p.description || '',
          longDescription: p.description || '',
          ingredients: p.ingredients || '',
          howToUse: p.how_to_use || '',
        }));
        if (mounted) setProducts(mapped);
      } catch (e) {
        console.warn('failed to load products', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, []);

  const bestSellers = products.filter(p => p.category === 'Our Best Sellers').slice(0, 4);
  const famousProducts = products.filter(p => p.category === 'Famous Fragrances').slice(0, 4);
  const mostReordered = products.filter(p => p.category === 'Cherished by You').slice(0, 4);
  const featuredProduct = products.find(p => p.category === 'Our Best Sellers') || products[0];

  // Debug logging
  // console.log('Total products loaded:', products.length);
  // console.log('All categories:', products.map(p => p.category));
  // console.log('Best Sellers:', bestSellers.length);
  // console.log('Famous Fragrances:', famousProducts.length);
  // console.log('Cherished by You:', mostReordered.length);

  return (
    <main>
      <Hero />
      <ArtOfPerfumerySection />
      
      <ProductShowcase 
        id="best-sellers"
        title="Our Best Sellers"
        description="The undisputed champions of our collection, loved by all."
        products={bestSellers}
      />
      
      <FeaturesSection />

      <ProductShowcase 
        id="famous-fragrances"
        title="Famous Fragrances"
        description="Iconic scents that have defined our legacy and captured hearts."
        products={famousProducts}
      />

      {featuredProduct && <FeaturedProduct product={featuredProduct} />}

      <ProductShowcase 
        id="customer-favorites"
        title="Cherished by You"
        description="The beloved fragrances our customers return to time and again."
        products={mostReordered}
      />

      <CustomSmellSection />
      <Testimonials />
      <ServicesSection />
      <FaqSection />
      <InstagramSection />
    </main>
  );
};

export default HomePage;
