import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Field from '../../components/Field';
import { badgeClass, inputClass, panelCard } from '../../lib/ui';
import { useAuthStore } from '../../stores/auth';
import ProductFormPanel from './ProductFormPanel';
import type { ProductFormState } from './ProductFormPanel';
import {
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useDeleteProduct,
  useMappedProducts,
  useUpdateProduct,
  useUploadProductImage,
  type MappedProduct,
} from './hooks';

const emptyCategoryForm = {
  name: '',
  sortOrder: '0',
};

const emptyProductForm: ProductFormState = {
  name: '',
  categoryId: '',
  sku: '',
  description: '',
  price: '',
  taxRate: '0.18',
  preparationTimeMinutes: '15',
  imageUrl: '',
};

export default function InventoryView() {
  const authUser = useAuthStore((state) => state.user);

  const { mappedProducts } = useMappedProducts();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  const createCategory = useCreateCategory();
  const uploadProductImage = useUploadProductImage();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const showNotice = (tone: 'error' | 'info', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return mappedProducts.filter((item) => {
      const matchCategory = selectedCategoryFilter === 'ALL' || item.categoryId === selectedCategoryFilter;
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.categoryLabel.toLowerCase().includes(search);
      return matchCategory && matchSearch;
    });
  }, [mappedProducts, selectedCategoryFilter, productSearch]);

  const handleCreateCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser?.branchId) return;

    createCategory.mutate(
      {
        branchId: authUser.branchId,
        name: categoryForm.name,
        sortOrder: Number(categoryForm.sortOrder || 0),
      },
      {
        onSuccess: () => {
          setCategoryForm(emptyCategoryForm);
          setShowCategoryForm(false);
          showNotice('info', 'Categoría creada correctamente.');
        },
        onError: (error) =>
          showNotice('error', error instanceof Error ? error.message : 'No se pudo crear la categoría.'),
      }
    );
  };

  const handleSubmitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser?.branchId) return;

    try {
      let uploadedImageUrl: string | null = productForm.imageUrl || null;

      if (productImageFile) {
        const uploadData = await uploadProductImage.mutateAsync(productImageFile);
        uploadedImageUrl = uploadData.fileUrl;
      }

      if (editingProductId) {
        await updateProduct.mutateAsync({
          productId: editingProductId,
          input: {
            categoryId: productForm.categoryId || null,
            sku: productForm.sku || null,
            name: productForm.name,
            description: productForm.description || null,
            price: Number(productForm.price),
            taxRate: Number(productForm.taxRate || 0.18),
            preparationTimeMinutes: Number(productForm.preparationTimeMinutes || 15),
            availableForSale: true,
            imageUrl: uploadedImageUrl,
          },
        });

        setEditingProductId(null);
        setProductForm(emptyProductForm);
        setProductImageFile(null);
        setShowProductForm(false);
        showNotice('info', 'Producto actualizado correctamente.');
        return;
      }

      await createProduct.mutateAsync({
        branchId: authUser.branchId,
        categoryId: productForm.categoryId || null,
        sku: productForm.sku || null,
        name: productForm.name,
        description: productForm.description || null,
        price: Number(productForm.price),
        taxRate: Number(productForm.taxRate || 0.18),
        preparationTimeMinutes: Number(productForm.preparationTimeMinutes || 15),
        imageUrl: uploadedImageUrl,
      });

      setProductForm(emptyProductForm);
      setProductImageFile(null);
      setShowProductForm(false);
      showNotice('info', 'Producto creado correctamente.');
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    }
  };

  const startEditProduct = (item: MappedProduct) => {
    setEditingProductId(item.id);
    setProductForm({
      name: item.name || '',
      categoryId: item.categoryId || '',
      sku: item.sku || '',
      description: item.description || '',
      price: String(item.priceNumber || item.price || ''),
      taxRate: String(item.taxRate || '0.18'),
      preparationTimeMinutes: String(item.preparationTimeMinutes || '15'),
      imageUrl: item.imageUrl || '',
    });

    setProductImageFile(null);
    setShowProductForm(true);
    showNotice('info', 'Edición cargada en el formulario.');
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setShowProductForm(false);
  };

  const handleDeleteProduct = (product: MappedProduct) => {
    const confirmed = window.confirm(`¿Eliminar ${product.name}?`);
    if (!confirmed) return;

    deleteProduct.mutate(product.id, {
      onSuccess: () => showNotice('info', 'Producto eliminado correctamente.'),
      onError: (error) =>
        showNotice('error', error instanceof Error ? error.message : 'No se pudo eliminar el producto.'),
    });
  };

  const isSavingProduct = uploadProductImage.isPending || createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-6">
      {notice ? (
        <div
          className={`rounded-3xl border px-5 py-4 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className={panelCard}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Inventario comercial</h3>
            <p className="mt-1 text-sm text-slate-500">
              Crea categorías y productos desde la web
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setShowCategoryForm((v) => !v)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {showCategoryForm ? 'Ocultar categoría' : 'Nueva categoría'}
            </button>

            <button
              onClick={() => setShowProductForm((v) => !v)}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {showProductForm ? 'Ocultar producto' : 'Nuevo producto'}
            </button>
          </div>
        </div>

        {showCategoryForm && (
          <form
            onSubmit={handleCreateCategory}
            className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
          >
            <Field label="Nombre de categoría">
              <input
                className={inputClass}
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </Field>

            <Field label="Orden">
              <input
                className={inputClass}
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm((p) => ({ ...p, sortOrder: e.target.value }))}
              />
            </Field>

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryForm(emptyCategoryForm);
                  setShowCategoryForm(false);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={createCategory.isPending}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Guardar categoría
              </button>
            </div>
          </form>
        )}

        {showProductForm && (
          <ProductFormPanel
            productForm={productForm}
            onProductFormChange={setProductForm}
            categories={categories}
            productImageFile={productImageFile}
            onProductImageFileChange={setProductImageFile}
            editingProductId={editingProductId}
            isSaving={isSavingProduct}
            onSubmit={handleSubmitProduct}
            onCancel={cancelEditProduct}
          />
        )}

        <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-md">
              <input
                className={inputClass}
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-slate-700">{filteredProducts.length}</span>{' '}
              producto(s)
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  String(selectedCategoryFilter) === String(category.id)
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="py-3 pr-4">Producto</th>
                <th className="py-3 pr-4">Categoría</th>
                <th className="py-3 pr-4">Precio</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium">{item.name}</td>
                  <td className="py-3 pr-4">{item.categoryLabel}</td>
                  <td className="py-3 pr-4">S/ {item.priceNumber.toFixed(2)}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(item.stockLabel)}`}
                    >
                      {item.stockLabel}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEditProduct(item)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(item)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    No se encontraron productos con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
