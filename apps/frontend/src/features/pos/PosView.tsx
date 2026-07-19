import { useMemo, useState } from 'react';
import { usePosStore } from '../../stores/pos';
import PosCatalog from './PosCatalog';
import PosCart from './PosCart';
import {
  useAddOrderItem,
  useCategories,
  useCurrentOrder,
  useDeleteOrderItem,
  useMappedProducts,
  usePatchOrderItem,
  type MappedProduct,
} from './hooks';

export default function PosView() {
  const selectedTable = usePosStore((state) => state.selectedTable);
  const setSelectedTable = usePosStore((state) => state.setSelectedTable);

  const [orderType, setOrderType] = useState('Salón');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const { mappedProducts } = useMappedProducts();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  const { mappedTables, currentOrderEntity, currentOrder, total } = useCurrentOrder(selectedTable);

  const addOrderItem = useAddOrderItem();
  const patchOrderItem = usePatchOrderItem();
  const deleteOrderItem = useDeleteOrderItem();

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

  const showNotice = (tone: 'error' | 'info', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const handleAddProduct = (product: MappedProduct) => {
    if (!currentOrderEntity) {
      showNotice('info', 'Primero crea un pedido para la mesa seleccionada.');
      return;
    }

    const existingItem = currentOrder.find(
      (item) => item.productId === product.id && item.note === ''
    );

    if (existingItem) {
      patchOrderItem.mutate(
        { itemId: existingItem.id, input: { qty: existingItem.qty + 1, notes: '' } },
        {
          onError: (error) =>
            showNotice('error', error instanceof Error ? error.message : 'No se pudo actualizar el pedido.'),
        }
      );
      return;
    }

    addOrderItem.mutate(
      {
        orderId: currentOrderEntity.id,
        input: { productId: product.id, qty: 1, notes: '', discountAmount: 0 },
      },
      {
        onSuccess: () => showNotice('info', `${product.name} agregado al pedido.`),
        onError: (error) =>
          showNotice('error', error instanceof Error ? error.message : 'No se pudo agregar el producto.'),
      }
    );
  };

  const handleUpdateItemQty = (itemId: string, newQty: number, note = '') => {
    if (!currentOrderEntity) {
      showNotice('info', 'No hay pedido activo para esta mesa.');
      return;
    }

    if (newQty <= 0) {
      deleteOrderItem.mutate(itemId, {
        onError: (error) =>
          showNotice('error', error instanceof Error ? error.message : 'No se pudo eliminar el item.'),
      });
      return;
    }

    patchOrderItem.mutate(
      { itemId, input: { qty: Number(newQty), notes: note || '' } },
      {
        onError: (error) =>
          showNotice('error', error instanceof Error ? error.message : 'No se pudo actualizar la cantidad.'),
      }
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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

        <PosCatalog
          products={filteredProducts}
          categories={categories}
          selectedCategoryFilter={selectedCategoryFilter}
          onCategoryFilterChange={setSelectedCategoryFilter}
          productSearch={productSearch}
          onProductSearchChange={setProductSearch}
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          onAddProduct={handleAddProduct}
        />
      </div>

      <div className="space-y-6">
        <PosCart
          selectedTable={selectedTable}
          onSelectedTableChange={setSelectedTable}
          mappedTables={mappedTables}
          currentOrderEntity={currentOrderEntity}
          currentOrder={currentOrder}
          total={total}
          onUpdateItemQty={handleUpdateItemQty}
        />
      </div>
    </div>
  );
}
