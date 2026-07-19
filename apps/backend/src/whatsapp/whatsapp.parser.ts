/* Parses a WhatsApp order message:
   detects products, quantities, and computes the total. */

export interface ParsedItem {
  productKey: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ParsedOrder {
  ok: boolean;
  items: ParsedItem[];
  total: number;
  needsConfirmation: boolean;
  message: string;
}

export const normalizeText = (text: unknown = ''): string => {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const productCatalog = [
  {
    key: 'ceviche_conchas_negras',
    name: 'Ceviche de Conchas Negras',
    price: 35,
    aliases: ['ceviche de conchas negras', 'conchas negras', 'ceviche conchas negras'],
  },
  {
    key: 'inka_kola_1l',
    name: 'Inka Kola 1L',
    price: 8,
    aliases: [
      'inka kola 1 litro',
      'inka kola 1l',
      'gaseosa inka kola 1 litro',
      'inka kola de 1 litro',
    ],
  },
  {
    key: 'ceviche_clasico',
    name: 'Ceviche Clasico',
    price: 30,
    aliases: ['ceviche clasico', 'ceviche clásico'],
  },
];

const escapeRegExp = (text = ''): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const extractQuantity = (message: string, alias: string): number => {
  const safeAlias = escapeRegExp(alias);

  const patterns = [
    new RegExp(`(\\d+)\\s+${safeAlias}`, 'i'),
    new RegExp(`${safeAlias}\\s+x\\s*(\\d+)`, 'i'),
    new RegExp(`${safeAlias}\\s+(\\d+)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const qty = Number(match[1]);
      if (!Number.isNaN(qty) && qty > 0) return qty;
    }
  }

  return 1;
};

export const parseOrderMessage = (rawMessage: unknown = ''): ParsedOrder => {
  const message = normalizeText(rawMessage);

  if (!message) {
    return {
      ok: false,
      items: [],
      total: 0,
      needsConfirmation: true,
      message: 'Mensaje vacío',
    };
  }

  const foundItems: ParsedItem[] = [];
  const matchedRanges: Array<{ start: number; end: number }> = [];

  const catalogSorted = [...productCatalog].sort((a, b) => {
    const aLongest = Math.max(...a.aliases.map((alias) => normalizeText(alias).length));
    const bLongest = Math.max(...b.aliases.map((alias) => normalizeText(alias).length));
    return bLongest - aLongest;
  });

  for (const product of catalogSorted) {
    let selectedAlias: string | null = null;
    let selectedIndex = -1;

    for (const alias of product.aliases) {
      const normalizedAlias = normalizeText(alias);
      const index = message.indexOf(normalizedAlias);

      if (index !== -1) {
        const aliasEnd = index + normalizedAlias.length;

        const overlaps = matchedRanges.some(
          (range) => index < range.end && aliasEnd > range.start
        );

        if (!overlaps) {
          selectedAlias = normalizedAlias;
          selectedIndex = index;
          break;
        }
      }
    }

    if (selectedAlias) {
      const qty = extractQuantity(message, selectedAlias);

      foundItems.push({
        productKey: product.key,
        name: product.name,
        qty,
        price: product.price,
        subtotal: qty * product.price,
      });

      matchedRanges.push({
        start: selectedIndex,
        end: selectedIndex + selectedAlias.length,
      });
    }
  }

  const total = foundItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    ok: foundItems.length > 0,
    items: foundItems,
    total,
    needsConfirmation: true,
    message:
      foundItems.length > 0
        ? 'Productos detectados correctamente'
        : 'No se detectaron productos válidos',
  };
};
