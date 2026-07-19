import type { FormEvent } from 'react';
import type { CategoryWithBranch } from '@restaurante/shared';
import Field from '../../components/Field';
import { inputClass } from '../../lib/ui';

export interface ProductFormState {
  name: string;
  categoryId: string;
  sku: string;
  description: string;
  price: string;
  taxRate: string;
  preparationTimeMinutes: string;
  imageUrl: string;
}

interface ProductFormPanelProps {
  productForm: ProductFormState;
  onProductFormChange: (updater: (prev: ProductFormState) => ProductFormState) => void;
  categories: CategoryWithBranch[];
  productImageFile: File | null;
  onProductImageFileChange: (file: File | null) => void;
  editingProductId: string | null;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function ProductFormPanel({
  productForm,
  onProductFormChange,
  categories,
  productImageFile,
  onProductImageFileChange,
  editingProductId,
  isSaving,
  onSubmit,
  onCancel,
}: ProductFormPanelProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <Field label="Nombre">
        <input
          className={inputClass}
          value={productForm.name}
          onChange={(e) => onProductFormChange((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </Field>

      <Field label="Categoría">
        <select
          className={inputClass}
          value={productForm.categoryId}
          onChange={(e) => onProductFormChange((p) => ({ ...p, categoryId: e.target.value }))}
        >
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="SKU">
        <input
          className={inputClass}
          value={productForm.sku}
          onChange={(e) => onProductFormChange((p) => ({ ...p, sku: e.target.value }))}
        />
      </Field>

      <Field label="Descripción">
        <input
          className={inputClass}
          value={productForm.description}
          onChange={(e) => onProductFormChange((p) => ({ ...p, description: e.target.value }))}
        />
      </Field>

      <Field label="Precio">
        <input
          className={inputClass}
          value={productForm.price}
          onChange={(e) => onProductFormChange((p) => ({ ...p, price: e.target.value }))}
          required
        />
      </Field>

      <Field label="Imagen referencial">
        <label className="flex h-[46px] cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">
          <span className="truncate">
            {productImageFile ? productImageFile.name : 'Seleccionar imagen'}
          </span>

          <span className="shrink-0 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
            Elegir
          </span>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onProductImageFileChange(e.target.files?.[0] || null)}
          />
        </label>
      </Field>

      <Field label="IGV">
        <input
          className={inputClass}
          value={productForm.taxRate}
          onChange={(e) => onProductFormChange((p) => ({ ...p, taxRate: e.target.value }))}
        />
      </Field>

      <Field label="Preparación (min)">
        <input
          className={inputClass}
          value={productForm.preparationTimeMinutes}
          onChange={(e) =>
            onProductFormChange((p) => ({ ...p, preparationTimeMinutes: e.target.value }))
          }
        />
      </Field>

      <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {editingProductId ? 'Guardar cambios' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}
