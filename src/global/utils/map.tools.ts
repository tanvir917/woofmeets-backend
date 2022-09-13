export const mapToObject = <T extends Map<any, any>>(m: T) => {
  return Array.from(m).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
};
