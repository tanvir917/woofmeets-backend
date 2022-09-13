// export const latlongDistanceCalculator = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number,
// ) => {
//   const p = 0.017453292519943295; // Math.PI / 180
//   const c = Math.cos;
//   const a =
//     0.5 -
//     c((lat2 - lat1) * p) / 2 +
//     (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

//   return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
// };
export const latlongDistanceCalculator = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
