import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { apiGetProducts } from '../lib/api';
import { Sparkles } from 'lucide-react';

type FilterType = 'All' | 'Perfume' | 'Attar';

const AllProductsPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
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
          categories: [],
          category: p.category,
          product_type: p.product_type,
          shortDescription: p.description || '',
          longDescription: p.description || '',
          ingredients: p.ingredients || '',
          howToUse: p.how_to_use || '',
        }));
        if (mounted) setProducts(mapped);
      } catch (err) {
        console.warn('Failed to load products', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, []);

  const filteredProducts = activeFilter === 'All'
    ? products
    : products.filter(p => p.type === activeFilter);

  const filters: FilterType[] = ['All', 'Perfume', 'Attar'];

  return (
    <main className="pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary-bg to-background py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full mb-6"
            >
              <Sparkles size={16} className="text-heading" />
              <span className="text-sm tracking-widest uppercase text-heading font-jost">Discover Your Signature Scent</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-widest mb-6"
            >
              Our Fragrance Collection
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-foreground text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            >
              Explore our complete collection of handcrafted perfumes and pure attars from Kannauj. Each bottle is a testament to tradition and craftsmanship.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center">
            <div className="inline-flex bg-primary-bg rounded-full p-1.5 gap-1">
              {filters.map((filter, index) => (
                <motion.button
                  key={filter}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "relative px-8 py-3 text-base font-sans tracking-wider rounded-full transition-all duration-300",
                    activeFilter === filter
                      ? "bg-heading text-white shadow-lg"
                      : "text-foreground hover:text-heading"
                  )}
                >
                  {filter}
                  {activeFilter === filter && (
                    <motion.span
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-heading rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Results Count */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between items-center mb-10"
        >
          <p className="text-foreground text-sm tracking-wider">
            {loading ? '' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'Product' : 'Products'}`}
          </p>
        </motion.div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14"
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20"
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-heading border-t-transparent"></div>
                <p className="mt-4 text-foreground tracking-wider">Loading fragrances...</p>
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-20"
              >
                <p className="text-2xl font-light tracking-widest text-heading mb-2">No fragrances found</p>
                <p className="text-foreground">Try adjusting your filters</p>
              </motion.div>
            ) : filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.05,
                  layout: { duration: 0.3 }
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
};

export default AllProductsPage;
