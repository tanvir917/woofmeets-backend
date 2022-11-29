export const isStringNumeric = (value: string) => {
  return /^-?\d+$/.test(value);
};

export const isStringDate = (date: string) => {
  return !isNaN(new Date(date).getDate()) && Date.parse(date);
};
