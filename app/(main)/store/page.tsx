'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import {
    Plus,
    Search,
    Package,
    Trash2,
    Edit2,
    X,
    ToggleLeft,
    ToggleRight,
    Loader2,
    FolderPlus
} from 'lucide-react';
import Link from 'next/link';

// Lazy load modal components for code splitting
const ProductFormModal = lazy(() => import('./ProductFormModal'));
const CategoryFormModal = lazy(() => import('./CategoryFormModal'));
const ConfirmModal = lazy(() => import('./ConfirmModal'));

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

export default function StorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

    // Product form state
    const [isEditing, setIsEditing] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formImageUrl, setFormImageUrl] = useState('');
    const [formCategoryId, setFormCategoryId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Category form state
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/product-categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormPrice('');
        setFormImageUrl('');
        setFormCategoryId(null);
        setEditingProduct(null);
        setIsEditing(false);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormDescription(product.description || '');
        setFormPrice(product.price?.toString() || '');
        setFormImageUrl(product.image_url || '');
        setFormCategoryId(product.category_id);
        setIsEditing(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success && data.url) {
                setFormImageUrl(data.url);
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formName.trim()) return;

        setSaving(true);
        try {
            const payload = {
                id: editingProduct?.id,
                name: formName.trim(),
                description: formDescription.trim() || null,
                price: formPrice ? parseFloat(formPrice) : null,
                imageUrl: formImageUrl || null,
                categoryId: formCategoryId,
            };

            const res = await fetch('/api/products', {
                method: editingProduct ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const savedProduct = await res.json();
                const productId = savedProduct.id;

                // Save variations if any
                const variations = (window as any).__productVariations || [];
                for (const variation of variations) {
                    if (variation.isNew || !variation.id) {
                        // Create new variation
                        await fetch('/api/product-variations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                productId,
                                variationTypeId: variation.variation_type_id,
                                value: variation.value,
                                price: variation.price,
                            }),
                        });
                    } else {
                        // Update existing variation
                        await fetch('/api/product-variations', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: variation.id,
                                value: variation.value,
                                price: variation.price,
                            }),
                        });
                    }
                }

                // Clean up
                delete (window as any).__productVariations;

                await fetchProducts();
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save product:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (product: Product) => {
        try {
            await fetch('/api/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: product.id,
                    isActive: !product.is_active,
                }),
            });
            await fetchProducts();
        } catch (error) {
            console.error('Failed to toggle product:', error);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
                    await fetchProducts();
                } catch (error) {
                    console.error('Failed to delete product:', error);
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            await fetch('/api/product-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    color: newCategoryColor,
                }),
            });
            await fetchCategories();
            setNewCategoryName('');
            setNewCategoryColor('#6B7280');
            setShowCategoryForm(false);
        } catch (error) {
            console.error('Failed to add category:', error);
        }
    };

    const handleDeleteCategory = (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Category',
            message: `Are you sure you want to delete "${name}"? Products in this category will become uncategorized.`,
            onConfirm: async () => {
                try {
                    await fetch(`/api/product-categories?id=${id}`, { method: 'DELETE' });
                    if (selectedCategoryFilter === id) {
                        setSelectedCategoryFilter(null);
                    }
                    await fetchCategories();
                    await fetchProducts();
                } catch (error) {
                    console.error('Failed to delete category:', error);
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
        });
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategoryFilter || product.category_id === selectedCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    const formatPrice = (price: number | null) => {
        if (price === null) return 'No price set';
        return `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Store</h1>
                        <p className="text-gray-500 mt-2 text-lg">Manage your products and inventory</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCategoryForm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm"
                        >
                            <FolderPlus size={18} />
                            Add Category
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full hover:from-teal-600 hover:to-emerald-600 transition-all font-medium text-sm shadow-lg shadow-teal-500/25"
                        >
                            <Plus size={18} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-gray-900 placeholder-gray-400"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedCategoryFilter(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategoryFilter
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            All
                        </button>
                        {categories.map((category) => (
                            <div key={category.id} className="relative group">
                                <button
                                    onClick={() => setSelectedCategoryFilter(category.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 pr-8 ${selectedCategoryFilter === category.id
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.id, category.name);
                                    }}
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${selectedCategoryFilter === category.id
                                        ? 'hover:bg-white/20 text-white/70 hover:text-white'
                                        : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                                        }`}
                                    title={`Delete ${category.name}`}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <span className="text-lg">Loading products...</span>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 px-4 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                            <Package size={40} className="text-teal-500" />
                        </div>
                        <h3 className="text-gray-900 font-semibold text-xl mb-2">No products yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            Add your first product to get started with your store.
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full hover:from-teal-600 hover:to-emerald-600 transition-all font-medium shadow-lg shadow-teal-500/25"
                        >
                            <Plus size={20} />
                            Add Your First Product
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className={`group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 ${!product.is_active ? 'opacity-60' : ''
                                    }`}
                            >
                                {/* Product Image */}
                                <Link href={`/product/${product.id}`}>
                                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden cursor-pointer">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={48} className="text-gray-300" />
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        {product.category && (
                                            <div
                                                className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm"
                                                style={{ backgroundColor: `${product.category.color}CC` }}
                                            >
                                                {product.category.name}
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        {!product.is_active && (
                                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gray-900/80 text-white backdrop-blur-sm">
                                                Inactive
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                                        {product.name}
                                    </h3>
                                    {product.description && (
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                                            {product.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-teal-600">
                                            {formatPrice(product.price)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleToggleActive(product)}
                                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            {product.is_active ? (
                                                <ToggleRight size={20} className="text-teal-500" />
                                            ) : (
                                                <ToggleLeft size={20} />
                                            )}
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, product.name)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lazy-loaded Modals with Suspense */}
            <Suspense fallback={<div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"><Loader2 className="animate-spin text-white" size={32} /></div>}>
                {/* Product Form Modal */}
                <ProductFormModal
                    isOpen={isEditing}
                    editingProduct={editingProduct}
                    formName={formName}
                    setFormName={setFormName}
                    formDescription={formDescription}
                    setFormDescription={setFormDescription}
                    formPrice={formPrice}
                    setFormPrice={setFormPrice}
                    formImageUrl={formImageUrl}
                    setFormImageUrl={setFormImageUrl}
                    formCategoryId={formCategoryId}
                    setFormCategoryId={setFormCategoryId}
                    categories={categories}
                    uploading={uploading}
                    saving={saving}
                    onSave={handleSave}
                    onClose={resetForm}
                    onImageUpload={handleImageUpload}
                    onOpenCategoryForm={() => setShowCategoryForm(true)}
                />

                {/* Category Form Modal */}
                <CategoryFormModal
                    isOpen={showCategoryForm}
                    categoryName={newCategoryName}
                    setCategoryName={setNewCategoryName}
                    categoryColor={newCategoryColor}
                    setCategoryColor={setNewCategoryColor}
                    onSave={handleAddCategory}
                    onClose={() => setShowCategoryForm(false)}
                />

                {/* Confirmation Modal */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />
            </Suspense>
        </div>
    );
}
