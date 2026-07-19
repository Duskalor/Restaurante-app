import type { CategoryWithBranch } from '@restaurante/shared';
import EmptyState from '../../components/EmptyState';
import { inputClass, panelCard } from '../../lib/ui';
import type { MappedProduct } from './hooks';

const ORDER_TYPES = ['Salón', 'Delivery', 'Recojo'] as const;

interface PosCatalogProps {
  products: MappedProduct[];
  categories: CategoryWithBranch[];
  selectedCategoryFilter: string;
  onCategoryFilterChange: (categoryId: string) => void;
  productSearch: string;
  onProductSearchChange: (value: string) => void;
  orderType: string;
  onOrderTypeChange: (value: string) => void;
  onAddProduct: (product: MappedProduct) => void;
}

export default function PosCatalog({
  products,
  categories,
  selectedCategoryFilter,
  onCategoryFilterChange,
  productSearch,
  onProductSearchChange,
  orderType,
  onOrderTypeChange,
  onAddProduct,
}: PosCatalogProps) {
  return (
    <div className={panelCard}>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Punto de venta</h3>
          <p className="text-sm text-slate-500">
            Catálogo compacto para trabajar con muchos productos desde una sola vista.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ORDER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onOrderTypeChange(type)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                orderType === type ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_auto]">
        <input
          className={inputClass}
          placeholder="Buscar plato, bebida o categoría"
          value={productSearch}
          onChange={(e) => onProductSearchChange(e.target.value)}
        />

        <select
          className={inputClass}
          value={selectedCategoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <option value="ALL">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryFilterChange('ALL')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            selectedCategoryFilter === 'ALL' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'
          }`}
        >
          Todo
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryFilterChange(category.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              selectedCategoryFilter === category.id
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {products.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-40 bg-slate-100">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="min-h-[72px] text-lg font-semibold text-slate-900">{item.name}</p>

              <p className="mt-1 text-sm text-slate-500">{item.categoryLabel}</p>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xl font-bold text-slate-900">S/ {item.priceNumber.toFixed(2)}</p>

                <button
                  type="button"
                  onClick={() => onAddProduct(item)}
                  className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shrink-0"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}

        {!products.length && (
          <div className="col-span-full">
            <EmptyState title="Sin resultados" text="No hay productos que coincidan con ese filtro." />
          </div>
        )}
      </div>
    </div>
  );
}
