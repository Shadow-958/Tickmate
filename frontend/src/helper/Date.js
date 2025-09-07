
export const formatDate = (dateString) => {
  const options = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};



