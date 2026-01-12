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
          className="mt-8 inline-block bg-heading text-white font-sans capitalize text-lg px-12 py-4 hover:bg-opacity-90 transition-colors"
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
    <main className="pt-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Column with Gallery */}
          <div className="flex flex-col items-center justify-start">
            {/* Main Image */}
            <div className="bg-gray-50 aspect-square w-full max-w-lg">
              <img 
                src={product.images[selectedImageIndex]} 
                alt={`${product.name} - Image ${selectedImageIndex + 1}`} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Thumbnail Gallery - Only show if multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto max-w-lg w-full px-2">
                {product.images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 border-2 transition-all hover:opacity-80",
                      selectedImageIndex === index 
                        ? "border-heading shadow-lg" 
                        : "border-gray-200"
                    )}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div>
            <div className="flex items-center gap-3 text-sm font-jost tracking-widest text-muted-foreground uppercase">
              <span>{product.type}</span>
              {product.categories[0] && (
                <>
                  <ChevronRight size={14} />
                  <span>{product.categories[0]}</span>
                </>
              )}
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-widest mt-2">{product.name}</h1>
            <p className="font-sans text-4xl text-heading mt-4">
              {product.price}
              {product.originalPrice && (
                <span className="ml-3 text-2xl text-gray-400 line-through">{product.originalPrice}</span>
              )}
            </p>
            <p className="mt-6 text-lg text-foreground leading-relaxed">{product.shortDescription}</p>

            <div className="mt-8 flex items-center gap-8">
              <div className="flex items-center border border-gray-200">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 h-12 flex items-center justify-center font-sans text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className={cn(
                  "flex-1 flex items-center justify-center font-sans uppercase text-lg tracking-wider px-8 py-3.5 rounded-md transition-all duration-300",
                  isAdded 
                    ? "bg-green-500 text-white" 
                    : "bg-heading text-white hover:bg-opacity-90"
                )}
                disabled={isAdded}
              >
                {isAdded ? (
                  <>
                    <Check size={20} className="mr-2" /> Added!
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>
            </div>

            <div className="mt-10 border-t border-gray-200">
              {accordionItems.map((item) => (
                <div key={item.title} className="border-b border-gray-200 py-5">
                  <button 
                    className="w-full flex justify-between items-center text-left"
                    onClick={() => setOpenAccordion(openAccordion === item.title.toLowerCase() ? null : item.title.toLowerCase())}
                  >
                    <h4 className="text-xl font-light tracking-widest">{item.title}</h4>
                    {openAccordion === item.title.toLowerCase() ? <Minus className="w-6 h-6 text-heading" /> : <Plus className="w-6 h-6 text-heading" />}
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openAccordion === item.title.toLowerCase() ? 'max-h-96 mt-4' : 'max-h-0'
                  )}>
                    <p className="text-foreground leading-relaxed pr-8">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 sm:py-24 bg-primary-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-light tracking-widest text-center mb-12">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetailPage;
