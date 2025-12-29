
export const maskDateInput = (value: string): string => {
  const v = value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) {
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  } else if (v.length >= 3) {
    return `${v.slice(0, 2)}/${v.slice(2)}`;
  }
  return v;
};

export const parseBRToISO = (dateStr: string): string | null => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return null;
  
  // Basic padding
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
};

export const formatISOToBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeBR = (isoStr: string): string => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const dateStr = formatISOToBR(isoStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};
