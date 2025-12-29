
export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
