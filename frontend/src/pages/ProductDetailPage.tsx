import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetProduct, apiGetProducts } from '../lib/api';
import { Plus, Minus, ChevronRight, Check, ShoppingBag, Heart, Share2, Package, Shield, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [isAdded, setIsAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!productId) return;
      setLoading(true);
      setSelectedImageIndex(0); // Reset to first image when product changes
      try {
        const res = await apiGetProduct(productId);
        const p = res?.product;
        const mapped = p ? {
          id: p.product_id,
          name: p.product_name,
          type: p.product_type === 'attar' ? 'Attar' : 'Perfume',
          price: p.price ? `₹${p.price}` : (p.variants && p.variants[0] ? `₹${p.variants[0].price}` : '₹0'),
          originalPrice: undefined,
          imageUrl: (p.media && p.media[0] && p.media[0].src) || '/placeholder.png',
          images: (p.media && p.media.length > 0) ? p.media.map((m: any) => m.src) : ['/placeholder.png'],
          categories: [],
          category: p.category,
          product_type: p.product_type,
          shortDescription: p.description || '',
          longDescription: p.description || '',
          ingredients: p.ingredients || '',
          howToUse: p.how_to_use || '',
          variantId: p.variants && p.variants[0] ? p.variants[0].variant_id : p.product_id,
        } : null;
        if (mounted) setProduct(mapped);

        // Load all products for related list
        const allRes = await apiGetProducts();
        const items = allRes?.products || [];
        const mappedAll = items.map((it: any) => ({
          id: it.product_id,
          name: it.product_name,
          type: it.product_type === 'attar' ? 'Attar' : 'Perfume',
          price: it.price ? `₹${it.price}` : (it.variants && it.variants[0] ? `₹${it.variants[0].price}` : '₹0'),
          imageUrl: (it.media && it.media[0] && it.media[0].src) || '/placeholder.png',
          shortDescription: it.description || '',
          category: it.category,
        }));
        if (mounted && mapped) {
          setRelatedProducts(mappedAll.filter((x: any) => x.id !== mapped.id).slice(0,3));
        } else if (mounted) {
          setRelatedProducts(mappedAll.slice(0,3));
        }
      } catch (err) {
        console.warn('Failed to load product', err);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [productId]);

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product, quantity);
      setIsAdded(true);
    }
  };

  useEffect(() => {
    if (isAdded) {
      const timer = setTimeout(() => setIsAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdded]);
  
  if (loading) {
    return (
      <div className="pt-32 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-heading border-t-transparent mb-4"></div>
        <h1 className="text-4xl font-light tracking-widest">Loading...</h1>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-32 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-light tracking-widest">Product Not Found</h1>
        <p className="mt-4 text-foreground">We couldn't find the fragrance you were looking for.</p>
        <Link 
          to="/products"
          className="mt-8 inline-block bg-heading text-white font-sans capitalize text-lg px-12 py-4 rounded-full hover:bg-opacity-90 transition-colors"
        >
          Back to All Products
        </Link>
      </div>
    );
  }

  const accordionItems = [
    { 
      title: 'Description', 
      content: product.longDescription || 'No description available.',
      icon: Sparkles
    },
    { 
      title: 'Ingredients', 
      content: product.ingredients || 'Ingredients information not available.',
      icon: Package
    },
    { 
      title: 'How to Use', 
      content: product.howToUse || 'Usage instructions not available.',
      icon: Shield
    },
  ];

  return (
    <main className="pt-20 bg-background">
      {/* Breadcrumb */}
      <div className="bg-primary-bg border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Link to="/" className="hover:text-heading transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to="/products" className="hover:text-heading transition-colors">Products</Link>
            <ChevronRight size={14} />
            <span className="text-heading font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20">
          {/* Image Gallery Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            {/* Main Image with Badge */}
            <div className="relative bg-primary-bg rounded-2xl overflow-hidden aspect-square mb-4 group">
              <motion.img 
                key={selectedImageIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={product.images[selectedImageIndex]} 
                alt={`${product.name} - Image ${selectedImageIndex + 1}`} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-jost uppercase tracking-widest text-heading">{product.type}</span>
              </div>
              {product.category && (
                <div className="absolute top-4 right-4 bg-heading/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <span className="text-xs font-jost uppercase tracking-widest text-white">{product.category}</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                {product.images.map((img: string, index: number) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                      selectedImageIndex === index 
                        ? "border-heading shadow-lg scale-105" 
                        : "border-gray-200 hover:border-heading/50"
                    )}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Product Title & Price */}
            <div className="mb-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-widest mb-4">{product.name}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-sans text-heading font-medium">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-400 line-through">{product.originalPrice}</span>
                )}
              </div>
            </div>

            {/* Short Description */}
            <p className="text-lg text-foreground leading-relaxed mb-8 pb-8 border-b border-gray-200">
              {product.shortDescription}
            </p>

            {/* Quantity & Add to Cart */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-jost uppercase tracking-widest text-foreground mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center border-2 border-gray-200 rounded-full overflow-hidden">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-primary-bg transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} />
                    </motion.button>
                    <span className="w-16 h-12 flex items-center justify-center font-sans text-xl font-medium">{quantity}</span>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-primary-bg transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 font-sans uppercase tracking-wider px-8 py-4 rounded-full transition-all duration-300 shadow-lg",
                    isAdded 
                      ? "bg-green-500 text-white" 
                      : "bg-heading text-white hover:bg-opacity-90 hover:shadow-xl"
                  )}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <>
                      <Check size={20} /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={20} /> Add to Cart
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 rounded-full hover:border-heading hover:text-heading transition-colors"
                  aria-label="Add to wishlist"
                >
                  <Heart size={20} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 rounded-full hover:border-heading hover:text-heading transition-colors"
                  aria-label="Share product"
                >
                  <Share2 size={20} />
                </motion.button>
              </div>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 p-6 bg-primary-bg rounded-2xl">
              <div className="text-center">
                <Package className="w-8 h-8 text-heading mx-auto mb-2" />
                <p className="text-xs font-jost uppercase tracking-widest text-foreground">Premium Quality</p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-heading mx-auto mb-2" />
                <p className="text-xs font-jost uppercase tracking-widest text-foreground">100% Authentic</p>
              </div>
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-heading mx-auto mb-2" />
                <p className="text-xs font-jost uppercase tracking-widest text-foreground">Handcrafted</p>
              </div>
            </div>

            {/* Accordion Details */}
            <div className="space-y-3">
              {accordionItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
                  >
                    <button 
                      className="w-full flex justify-between items-center text-left px-6 py-5 hover:bg-primary-bg/30 transition-colors"
                      onClick={() => setOpenAccordion(openAccordion === item.title.toLowerCase() ? null : item.title.toLowerCase())}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-heading" />
                        <h4 className="text-lg font-jost tracking-widest uppercase">{item.title}</h4>
                      </div>
                      <motion.div
                        animate={{ rotate: openAccordion === item.title.toLowerCase() ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Plus className="w-5 h-5 text-heading" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openAccordion === item.title.toLowerCase() && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-2">
                            <p className="text-foreground leading-relaxed">{item.content}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 sm:py-24 bg-primary-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl sm:text-5xl font-light tracking-widest mb-4">
                You Might Also Like
              </h2>
              <p className="text-foreground text-lg">Discover more exquisite fragrances</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {relatedProducts.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetailPage;
