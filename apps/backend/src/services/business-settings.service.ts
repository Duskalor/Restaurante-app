import prisma from '../prisma';

export function getBusinessSetting(branchId: string) {
  return prisma.businessSetting.findUnique({
    where: { branchId },
  });
}

export function upsertBusinessSetting(input: {
  branchId: string;
  businessName: string;
  ruc?: string | null;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}) {
  const { branchId, businessName, ruc, address, phone, logoUrl } = input;

  const fields = {
    businessName,
    ruc: ruc || null,
    address: address || null,
    phone: phone || null,
    logoUrl: logoUrl || null,
  };

  return prisma.businessSetting.upsert({
    where: { branchId },
    update: fields,
    create: { branchId, ...fields },
  });
}
