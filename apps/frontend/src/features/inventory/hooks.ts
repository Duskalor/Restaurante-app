import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiMessageResponse,
  CategoryWithBranch,
  CreateCategoryRequest,
  CreateProductRequest,
  ProductWithRelations,
  UpdateProductRequest,
  UploadProductImageResponse,
} from '@restaurante/shared';
import { apiFetch } from '../../lib/api';
import { categoriesQueryKey, productsQueryKey } from '../pos/hooks';

// `useProducts`, `useMappedProducts` and `useCategories` already live in
// ../pos/hooks (PosView and InventoryView both read the same `['products']` /
// `['categories']` cache) — re-exported here so inventory code has a single
// import surface for its own domain.
export { useCategories, useMappedProducts, useProducts } from '../pos/hooks';
export type { MappedProduct } from '../pos/hooks';

export function useCreateCategory(onSettledExtra?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryRequest) =>
      apiFetch<CategoryWithBranch>('/categories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      onSettledExtra?.();
    },
  });
}

/** Uploads the reference image; resolves to the URL to send as `imageUrl` on create/update. */
export function useUploadProductImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiFetch<UploadProductImageResponse>('/products/upload-image', {
        method: 'POST',
        body: formData,
      });
    },
  });
}

export function useCreateProduct(onSettledExtra?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductRequest) =>
      apiFetch<ProductWithRelations>('/products', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      onSettledExtra?.();
    },
  });
}

export function useUpdateProduct(onSettledExtra?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: UpdateProductRequest }) =>
      apiFetch<ProductWithRelations>(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      onSettledExtra?.();
    },
  });
}

export function useDeleteProduct(onSettledExtra?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      apiFetch<ApiMessageResponse>(`/products/${productId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
      onSettledExtra?.();
    },
  });
}
