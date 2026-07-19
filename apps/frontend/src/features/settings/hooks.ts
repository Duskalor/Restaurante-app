import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Branch,
  BusinessSetting,
  CreateUserRequest,
  Role,
  UploadLogoResponse,
  UpsertBusinessSettingRequest,
  UserWithBranchAndRole,
  UserWithRestaurant,
} from '@restaurante/shared';
import { apiFetch } from '../../lib/api';

export const branchesQueryKey = ['branches'] as const;
export const usersQueryKey = ['users'] as const;
export const rolesQueryKey = ['roles'] as const;

export const businessSettingsQueryKey = (branchId: string) =>
  ['business-settings', branchId] as const;

/**
 * `GET /branches` — the legacy `loadProtectedData` fetched this on every load
 * even though nothing renders branches yet; kept as a typed query for the
 * first consumer that needs it (nothing subscribes today, so no request fires).
 */
export function useBranches() {
  return useQuery({
    queryKey: branchesQueryKey,
    queryFn: () => apiFetch<Branch[]>('/branches'),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: () => apiFetch<UserWithBranchAndRole[]>('/users'),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: () => apiFetch<Role[]>('/roles'),
  });
}

/**
 * `GET /settings/business/:branchId`. The legacy `loadBusinessSetting` treated
 * this as optional (errors silently ignored, defaults kept) — consumers should
 * read `query.data` and ignore the error state, hence `retry: false`.
 */
export function useBusinessSettings(branchId: string | null | undefined) {
  return useQuery({
    queryKey: businessSettingsQueryKey(branchId ?? ''),
    queryFn: () => apiFetch<BusinessSetting | null>(`/settings/business/${branchId}`),
    enabled: Boolean(branchId),
    retry: false,
  });
}

/** `POST /settings/business` (upsert) — invalidates the branch's settings entry. */
export function useSaveBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertBusinessSettingRequest) =>
      apiFetch<BusinessSetting>('/settings/business', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: businessSettingsQueryKey(variables.branchId),
      });
    },
  });
}

/** `POST /settings/business/upload-logo` — multipart; apiFetch skips the JSON header for FormData. */
export function useUploadBusinessLogo() {
  return useMutation({
    mutationFn: (logoFile: File) => {
      const formData = new FormData();
      formData.append('logo', logoFile);
      return apiFetch<UploadLogoResponse>('/settings/business/upload-logo', {
        method: 'POST',
        body: formData,
      });
    },
  });
}

/** `POST /users` — invalidates `['users']` so the settings list refreshes. */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserRequest) =>
      apiFetch<UserWithRestaurant>('/users', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });
}
