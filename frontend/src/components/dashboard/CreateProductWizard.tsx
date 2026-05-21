import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Upload, Trash2, Plus } from 'lucide-react';
import { apiCreateProductComprehensive, apiUploadImageTemp } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface VariantImage {
  src: string;
  cloudinary_id: string;
  alt?: string;
  type: string;
}

interface Variant {
  name: string;
  price: number;
  stock: number;
  images: VariantImage[];
}

interface ProductFormData {
  product_name: string;
  description: string;
  ingredients: string;
  how_to_use: string;
  status: string;
  variant_attribute: string;
  variants: Variant[];
  product_images: VariantImage[];
}

interface CreateProductWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Basic Info', 'Variants & Images', 'Preview'];

const blankVariant = (): Variant => ({ name: '', price: 0, stock: 0, images: [] });

const CreateProductWizard = ({ onClose, onSuccess }: CreateProductWizardProps) => {
  const { success: showSuccess, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewVariantIdx, setPreviewVariantIdx] = useState(0);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);
  const [formData, setFormData] = useState<ProductFormData>({
    product_name: '',
    description: '',
    ingredients: '',
    how_to_use: '',
    status: 'draft',
    variant_attribute: 'Size',
    variants: [blankVariant()],
    product_images: [],
  });

  // -------------------- variants helpers --------------------
  const addVariant = () => {
    setFormData((f) => ({ ...f, variants: [...f.variants, blankVariant()] }));
  };

  const removeVariant = (idx: number) => {
    setFormData((f) => ({
      ...f,
      variants: f.variants.length === 1 ? f.variants : f.variants.filter((_, i) => i !== idx),
    }));
  };

  const updateVariant = (idx: number, field: keyof Variant, value: any) => {
    setFormData((f) => {
      const variants = [...f.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      return { ...f, variants };
    });
  };

  // -------------------- image upload --------------------
  const handleProductImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      const uploads = await apiUploadImageTemp(files);
      const mapped: VariantImage[] = uploads.map((u) => ({
        src: u.src,
        cloudinary_id: u.cloudinary_id,
        alt: u.alt || formData.product_name,
        type: u.type,
      }));
      setFormData((f) => ({ ...f, product_images: [...f.product_images, ...mapped] }));
    } catch (err) {
      console.error('Image upload failed:', err);
      showError('Failed to upload image. Please try again.');
    }
  };

  const handleVariantImageUpload = async (variantIdx: number, files: File[]) => {
    if (files.length === 0) return;
    try {
      const uploads = await apiUploadImageTemp(files);
      const mapped: VariantImage[] = uploads.map((u) => ({
        src: u.src,
        cloudinary_id: u.cloudinary_id,
        alt: u.alt || formData.product_name,
        type: u.type,
      }));
      setFormData((f) => {
        const variants = [...f.variants];
        variants[variantIdx] = {
          ...variants[variantIdx],
          images: [...variants[variantIdx].images, ...mapped],
        };
        return { ...f, variants };
      });
    } catch (err) {
      console.error('Variant image upload failed:', err);
      showError('Failed to upload image. Please try again.');
    }
  };

  const removeProductImage = (idx: number) => {
    setFormData((f) => ({
      ...f,
      product_images: f.product_images.filter((_, i) => i !== idx),
    }));
  };

  const removeVariantImage = (variantIdx: number, imgIdx: number) => {
    setFormData((f) => {
      const variants = [...f.variants];
      variants[variantIdx] = {
        ...variants[variantIdx],
        images: variants[variantIdx].images.filter((_, i) => i !== imgIdx),
      };
      return { ...f, variants };
    });
  };

  // -------------------- validation --------------------
  const step1Valid = formData.product_name.trim().length > 0;

  const step2Errors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.variant_attribute.trim()) errors.push('Variant attribute name is required (e.g., Size, Color).');
    if (formData.variants.length === 0) errors.push('Add at least one variant.');

    const names = formData.variants.map((v) => v.name.trim());
    if (names.some((n) => !n)) errors.push('Every variant needs a name.');
    if (new Set(names.filter(Boolean)).size !== names.filter(Boolean).length) {
      errors.push('Variant names must be unique.');
    }
    if (formData.variants.some((v) => isNaN(v.price) || v.price < 0)) errors.push('Each variant needs a valid price (≥ 0).');
    if (formData.variants.some((v) => !Number.isInteger(v.stock) || v.stock < 0)) errors.push('Each variant needs a whole-number stock (≥ 0).');

    return errors;
  }, [formData]);

  const step2Valid = step2Errors.length === 0;

  // -------------------- navigation --------------------
  const handleNext = () => {
    if (currentStep === 1 && !step1Valid) return;
    if (currentStep === 2 && !step2Valid) return;
    if (currentStep === 2) {
      // Reset preview state when entering preview
      setPreviewVariantIdx(0);
      setPreviewImageIdx(0);
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // -------------------- submit --------------------
  const handleSubmit = async () => {
    if (!step1Valid || !step2Valid) {
      showError('Please complete all required fields before submitting.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        product_name: formData.product_name.trim(),
        description: formData.description,
        ingredients: formData.ingredients,
        how_to_use: formData.how_to_use,
        status: formData.status,
        options: [
          {
            option_name: formData.variant_attribute.trim() || 'Variant',
            items: formData.variants.map((v) => v.name.trim()),
          },
        ],
        variants: formData.variants.map((v) => ({
          option1: v.name.trim(),
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          images: v.images,
        })),
        product_images: formData.product_images,
      };
      await apiCreateProductComprehensive(payload);
      showSuccess('Product created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create product:', err);
      showError('Error: ' + (err?.body?.detail || 'Failed to create product'));
    } finally {
      setLoading(false);
    }
  };

  // -------------------- preview helpers --------------------
  const previewVariant = formData.variants[previewVariantIdx];
  const previewImages: VariantImage[] = useMemo(() => {
    if (previewVariant && previewVariant.images.length > 0) return previewVariant.images;
    return formData.product_images;
  }, [previewVariant, formData.product_images]);

  // -------------------- step renderers --------------------
  const renderBasicInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-jost uppercase tracking-widest text-heading">Basic Product Information</h3>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Product Name *</label>
        <input
          type="text"
          value={formData.product_name}
          onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
          placeholder="Enter product name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
          rows={3}
          placeholder="Enter product description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Ingredients</label>
        <textarea
          value={formData.ingredients}
          onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
          rows={3}
          placeholder="List the ingredients"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">How to Use</label>
        <textarea
          value={formData.how_to_use}
          onChange={(e) => setFormData({ ...formData, how_to_use: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
          rows={3}
          placeholder="Instructions on how to use the product"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
  );

  const renderVariantsAndImages = () => (
    <div className="space-y-8">
      {/* Main Product Images */}
      <section>
        <h3 className="text-lg font-jost uppercase tracking-widest text-heading mb-2">Main Product Images</h3>
        <p className="text-sm text-foreground mb-3">
          Shown on the product card. Also used as a fallback when a variant has no images of its own.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-heading transition-colors">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) handleProductImageUpload(Array.from(e.target.files));
              e.target.value = '';
            }}
            className="hidden"
            id="main-product-image-upload"
          />
          <label htmlFor="main-product-image-upload" className="cursor-pointer text-heading font-medium hover:underline">
            Click to upload product images
          </label>
        </div>

        {formData.product_images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
            {formData.product_images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img.src} alt={img.alt} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => removeProductImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Variant attribute label */}
      <section>
        <h3 className="text-lg font-jost uppercase tracking-widest text-heading mb-2">Variants</h3>
        <p className="text-sm text-foreground mb-3">
          Add each variant with its own price, stock, and (optionally) images. Add as many as you need.
        </p>

        <div className="bg-primary-bg rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium mb-2 text-foreground">Variant attribute name</label>
          <input
            type="text"
            value={formData.variant_attribute}
            onChange={(e) => setFormData({ ...formData, variant_attribute: e.target.value })}
            placeholder="e.g., Size, Color, Volume"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-heading"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used as the section label on the product page (e.g., "Size: 20ml").
          </p>
        </div>

        <div className="space-y-4">
          {formData.variants.map((variant, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-heading">
                  Variant {idx + 1}
                  {variant.name ? ` — ${variant.name}` : ''}
                </p>
                {formData.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-foreground">
                    {formData.variant_attribute || 'Variant'} *
                  </label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                    placeholder={`e.g., 20ml`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-foreground">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number.isNaN(variant.price) ? '' : variant.price}
                    onChange={(e) => updateVariant(idx, 'price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-foreground">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={Number.isNaN(variant.stock) ? '' : variant.stock}
                    onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heading"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">
                    Variant Images <span className="text-gray-400 font-normal">(optional — falls back to main images)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id={`variant-img-${idx}`}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleVariantImageUpload(idx, Array.from(e.target.files));
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`variant-img-${idx}`}
                    className="cursor-pointer inline-flex items-center gap-1 text-xs bg-primary-bg text-heading px-3 py-1 rounded-full hover:bg-heading hover:text-white transition-colors"
                  >
                    <Upload className="w-3 h-3" /> Upload
                  </label>
                </div>
                {variant.images.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No variant images — will show main product image{formData.product_images.length === 0 ? ' (also empty)' : ''}.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {variant.images.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative group">
                        <img src={img.src} alt={img.alt} className="w-full h-16 object-cover rounded border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(idx, imgIdx)}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove variant image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addVariant}
          className="mt-4 w-full border-2 border-dashed border-heading text-heading rounded-lg py-3 hover:bg-primary-bg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add another variant
        </button>

        {step2Errors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {step2Errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );

  const renderPreview = () => {
    const minPrice = Math.min(...formData.variants.map((v) => v.price || 0));
    const maxPrice = Math.max(...formData.variants.map((v) => v.price || 0));
    const priceLabel =
      minPrice === maxPrice ? `₹${minPrice.toFixed(2)}` : `₹${minPrice.toFixed(2)} – ₹${maxPrice.toFixed(2)}`;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-jost uppercase tracking-widest text-heading">Preview</h3>
        <p className="text-sm text-foreground">This is how the product will appear on the site.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {/* Image side */}
          <div>
            <div className="aspect-square bg-primary-bg rounded-xl overflow-hidden flex items-center justify-center mb-3">
              {previewImages.length > 0 ? (
                <img
                  src={previewImages[Math.min(previewImageIdx, previewImages.length - 1)].src}
                  alt={formData.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image uploaded yet</span>
              )}
            </div>
            {previewImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {previewImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImageIdx(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      previewImageIdx === idx ? 'border-heading' : 'border-gray-200'
                    }`}
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {previewVariant && previewVariant.images.length === 0 && formData.product_images.length > 0 && (
              <p className="text-xs text-gray-500 mt-2 italic">
                "{previewVariant.name || 'This variant'}" has no own images — showing main product image.
              </p>
            )}
          </div>

          {/* Detail side */}
          <div>
            <h4 className="text-2xl font-light tracking-widest mb-2">{formData.product_name || 'Product Name'}</h4>
            <p className="text-3xl text-heading font-medium mb-3">
              {previewVariant ? `₹${(previewVariant.price || 0).toFixed(2)}` : priceLabel}
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                formData.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : formData.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {formData.status}
            </span>

            <p className="text-sm text-foreground whitespace-pre-line mb-4">
              {formData.description || 'No description'}
            </p>

            {formData.variants.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-jost uppercase tracking-widest text-foreground mb-2">
                  {formData.variant_attribute || 'Variant'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {formData.variants.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewVariantIdx(idx);
                        setPreviewImageIdx(0);
                      }}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        previewVariantIdx === idx ? 'border-heading bg-primary-bg' : 'border-gray-200 hover:border-heading/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-heading">{v.name || `Variant ${idx + 1}`}</p>
                      <p className="text-xs text-foreground">₹{(v.price || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{v.stock} in stock</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled
              className="w-full bg-heading text-white py-3 rounded-full opacity-75 cursor-not-allowed"
            >
              Add to Cart (preview)
            </button>
          </div>
        </div>

        <div className="bg-primary-bg rounded-lg p-4">
          <h4 className="font-jost uppercase text-xs tracking-widest text-heading mb-2">Summary</h4>
          <ul className="text-sm space-y-1 text-foreground">
            <li>• {formData.variants.length} variant(s)</li>
            <li>• {formData.product_images.length} main product image(s)</li>
            <li>• {formData.variants.reduce((sum, v) => sum + v.images.length, 0)} variant-specific image(s)</li>
            <li>• Status: {formData.status}</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (currentStep === 1) return renderBasicInfo();
    if (currentStep === 2) return renderVariantsAndImages();
    return renderPreview();
  };

  const canAdvance = currentStep === 1 ? step1Valid : currentStep === 2 ? step2Valid : true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-light tracking-widest text-heading">Create New Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-gray-200 p-4 bg-primary-bg">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`flex flex-col items-center ${
                    index <= currentStep - 1 ? 'text-heading' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                      index < currentStep - 1
                        ? 'bg-heading border-heading'
                        : index === currentStep - 1
                        ? 'border-heading bg-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {index < currentStep - 1 ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className={index === currentStep - 1 ? 'text-heading font-semibold' : 'text-gray-400'}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block whitespace-nowrap">{step}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${index < currentStep - 1 ? 'bg-heading' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderStep()}</div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance}
              className="flex items-center gap-2 px-6 py-2 bg-heading text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create Product'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProductWizard;
