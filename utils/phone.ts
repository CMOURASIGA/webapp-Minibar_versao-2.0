
export const normalizePhone = (raw: string): string => {
  let cleaned = raw.replace(/\D/g, '');
  
  if (cleaned.length > 0 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned.slice(0, 13);
};

export const isValidPhone = (normalized: string): boolean => {
  return normalized.length === 13;
};

export const formatPhoneDisplay = (phone: string): string => {
  if (phone.length !== 13) return phone;
  const ddi = phone.slice(0, 2);
  const ddd = phone.slice(2, 4);
  const part1 = phone.slice(4, 9);
  const part2 = phone.slice(9, 13);
  return `+${ddi} (${ddd}) ${part1}-${part2}`;
};
