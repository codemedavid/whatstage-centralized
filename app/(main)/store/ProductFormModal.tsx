'use client';

import { useRef, useState, useEffect } from 'react';
import {
    Plus,
    Loader2,
    Image as ImageIcon,
    ChevronDown,
    Trash2,
    Tag
} from 'lucide-react';

interface ProductCategory {
    id: string;
    name: string;
    color: string;
    description: string | null;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    currency: string;
    image_url: string | null;
    category_id: string | null;
    category: ProductCategory | null;
    is_active: boolean;
    display_order: number;
}

interface VariationType {
    id: string;
    name: string;
}

interface ProductVariation {
    id?: string;
    variation_type_id: string;
    variation_type?: VariationType;
    value: string;
    price: string;
    isNew?: boolean;
}

interface ProductFormModalProps {
    isOpen: boolean;
    editingProduct: Product | null;
    formName: string;
    setFormName: (name: string) => void;
    formDescription: string;
    setFormDescription: (desc: string) => void;
    formPrice: string;
    setFormPrice: (price: string) => void;
    formImageUrl: string;
    setFormImageUrl: (url: string) => void;
    formCategoryId: string | null;
    setFormCategoryId: (id: string | null) => void;
    categories: ProductCategory[];
    uploading: boolean;
    saving: boolean;
    onSave: () => void;
    onClose: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenCategoryForm: () => void;
}

export default function ProductFormModal({
    isOpen,
    editingProduct,
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    formImageUrl,
    formCategoryId,
    setFormCategoryId,
    categories,
    uploading,
    saving,
    onSave,
    onClose,
    onImageUpload,
    onOpenCategoryForm,
}: ProductFormModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Variation state
    const [variationTypes, setVariationTypes] = useState<VariationType[]>([]);
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [newVariationType, setNewVariationType] = useState('');
    const [showAddType, setShowAddType] = useState(false);

    // Fetch variation types on mount
    useEffect(() => {
        if (isOpen) {
            fetchVariationTypes();
            if (editingProduct) {
                fetchProductVariations(editingProduct.id);
            } else {
                setVariations([]);
            }
        }
    }, [isOpen, editingProduct]);

    const fetchVariationTypes = async () => {
        try {
            const res = await fetch('/api/product-variation-types');
            const data = await res.json();
            if (Array.isArray(data)) {
                setVariationTypes(data);
            }
        } catch (error) {
            console.error('Failed to fetch variation types:', error);
        }
    };

    const fetchProductVariations = async (productId: string) => {
        try {
            const res = await fetch(`/api/product-variations?productId=${productId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setVariations(data.map((v: any) => ({
                    id: v.id,
                    variation_type_id: v.variation_type_id,
                    variation_type: v.variation_type,
                    value: v.value,
                    price: v.price.toString(),
                })));
            }
        } catch (error) {
            console.error('Failed to fetch variations:', error);
        }
    };

    const handleAddVariationType = async () => {
        if (!newVariationType.trim()) return;

        try {
            const res = await fetch('/api/product-variation-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newVariationType.trim() }),
            });
            if (res.ok) {
                await fetchVariationTypes();
                setNewVariationType('');
                setShowAddType(false);
            }
        } catch (error) {
            console.error('Failed to add variation type:', error);
        }
    };

    const handleAddVariation = () => {
        if (variationTypes.length === 0) return;

        setVariations([...variations, {
            variation_type_id: variationTypes[0].id,
            variation_type: variationTypes[0],
            value: '',
            price: formPrice || '0',
            isNew: true,
        }]);
    };

    const handleUpdateVariation = (index: number, field: keyof ProductVariation, value: string) => {
        const updated = [...variations];
        if (field === 'variation_type_id') {
            const type = variationTypes.find(t => t.id === value);
            updated[index] = {
                ...updated[index],
                variation_type_id: value,
                variation_type: type,
            };
        } else {
            (updated[index] as any)[field] = value;
        }
        setVariations(updated);
    };

    const handleRemoveVariation = async (index: number) => {
        const variation = variations[index];
        if (variation.id && !variation.isNew) {
            try {
                await fetch(`/api/product-variations?id=${variation.id}`, { method: 'DELETE' });
            } catch (error) {
                console.error('Failed to delete variation:', error);
            }
        }
        setVariations(variations.filter((_, i) => i !== index));
    };

    const handleSaveWithVariations = async () => {
        // First save the product
        onSave();

        // Note: Variations will be saved after product is created/updated
        // This is handled in the parent component's onSave callback
    };

    // Expose variations for parent to save
    useEffect(() => {
        // Store variations in window for parent access (temporary solution)
        (window as any).__productVariations = variations;
    }, [variations]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[32px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {editingProduct ? 'Update your product details' : 'Create a new item for your store'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveWithVariations}
                            disabled={!formName.trim() || saving}
                            className="flex items-center gap-2 px-8 py-2.5 bg-[#4ADE80] text-emerald-950 rounded-full hover:bg-[#22c55e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving && <Loader2 className="animate-spin" size={18} />}
                            {editingProduct ? 'Save Changes' : 'Add Product'}
                        </button>
                    </div>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: General Info & Pricing & Variations */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* General Information Card */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">General Information</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Name Product
                                        </label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="e.g. Puffer Jacket With Pocket Detail"
                                            className="w-full px-5 py-3.5 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-xl transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description Product
                                        </label>
                                        <textarea
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                            placeholder="Description of the product..."
                                            rows={5}
                                            className="w-full px-5 py-3.5 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-xl transition-all text-gray-900 placeholder:text-gray-400 font-medium resize-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Pricing Card */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Base Pricing
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                                            <input
                                                type="number"
                                                value={formPrice}
                                                onChange={(e) => setFormPrice(e.target.value)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-xl transition-all text-gray-900 font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Stock
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            disabled
                                            className="w-full px-5 py-3.5 bg-gray-50 border-transparent rounded-xl text-gray-400 cursor-not-allowed"
                                            title="Stock tracking coming soon"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Variations Card */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Variations</h3>
                                        <p className="text-sm text-gray-500 mt-1">Add size, color, or other options with different prices</p>
                                    </div>
                                    <button
                                        onClick={handleAddVariation}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-100 transition-colors text-sm"
                                    >
                                        <Plus size={16} />
                                        Add Variation
                                    </button>
                                </div>

                                {/* Variation Type Management */}
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-600">Variation Types:</span>
                                        {variationTypes.map((type) => (
                                            <span
                                                key={type.id}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                                            >
                                                {type.name}
                                            </span>
                                        ))}
                                        {showAddType ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newVariationType}
                                                    onChange={(e) => setNewVariationType(e.target.value)}
                                                    placeholder="Type name"
                                                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddVariationType()}
                                                />
                                                <button
                                                    onClick={handleAddVariationType}
                                                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => { setShowAddType(false); setNewVariationType(''); }}
                                                    className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowAddType(true)}
                                                className="flex items-center gap-1 px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded-full text-sm font-medium transition-colors"
                                            >
                                                <Plus size={14} />
                                                Add Type
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Variations List */}
                                {variations.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Tag size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No variations yet</p>
                                        <p className="text-sm">Add variations to offer different options for this product</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {variations.map((variation, index) => (
                                            <div
                                                key={variation.id || index}
                                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                                            >
                                                {/* Variation Type */}
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                                                    <select
                                                        value={variation.variation_type_id}
                                                        onChange={(e) => handleUpdateVariation(index, 'variation_type_id', e.target.value)}
                                                        className="w-full px-3 py-2 text-black bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    >
                                                        {variationTypes.map((type) => (
                                                            <option key={type.id} value={type.id}>
                                                                {type.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Value */}
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 mb-1">Value</label>
                                                    <input
                                                        type="text"
                                                        value={variation.value}
                                                        onChange={(e) => handleUpdateVariation(index, 'value', e.target.value)}
                                                        placeholder="e.g. Small, Red"
                                                        className="w-full px-3 py-2 text-black bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    />
                                                </div>

                                                {/* Price */}
                                                <div className="w-32">
                                                    <label className="block text-xs text-gray-500 mb-1">Price (₱)</label>
                                                    <input
                                                        type="number"
                                                        value={variation.price}
                                                        onChange={(e) => handleUpdateVariation(index, 'price', e.target.value)}
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full px-3 py-2 text-black bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    />
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleRemoveVariation(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right Column: Images & Category */}
                        <div className="space-y-8">
                            {/* Upload Img Card */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Upload Img</h3>

                                <div className="space-y-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative aspect-square bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 transition-all cursor-pointer overflow-hidden group flex flex-col items-center justify-center p-4"
                                    >
                                        {formImageUrl ? (
                                            <img
                                                src={formImageUrl}
                                                alt="Product"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                                                    {uploading ? <Loader2 className="animate-spin text-emerald-500" /> : <ImageIcon className="text-gray-400" size={24} />}
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">Click to upload</p>
                                                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF</p>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-gray-700">
                                                Change Image
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={onImageUpload}
                                        className="hidden"
                                    />

                                    {/* Thumbnail Strip */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {formImageUrl && (
                                            <div className="aspect-square rounded-lg border-2 border-emerald-500 overflow-hidden p-1">
                                                <img src={formImageUrl} className="w-full h-full object-cover rounded-md" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-emerald-500 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Category Card */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Category</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Product Category
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formCategoryId || ''}
                                                onChange={(e) => setFormCategoryId(e.target.value || null)}
                                                className="w-full px-5 py-3.5 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-xl transition-all text-gray-900 appearance-none cursor-pointer font-medium"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>

                                    <button
                                        onClick={onOpenCategoryForm}
                                        className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add New Category
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
