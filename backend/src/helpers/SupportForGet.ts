const supportForGet = (query: any) => {
  const sortKey = (query.sortKey as string) || "id";
  const sortValue = (query.sortValue as string) || "ASC";
  const limit = Number(query.limit) || 10;
  const page = Number(query.page) || 1;
  const offset = (page - 1) * limit;
  return {
    sortKey,
    sortValue,
    limit,
    page,
    offset,
  };
};

export default supportForGet;
