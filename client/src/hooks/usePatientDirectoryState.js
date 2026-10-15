import { useState } from 'react';

export default function usePatientDirectoryState() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortBy: 'name', sortOrder: 'asc' });

  const changeSort = (sortBy) => {
    setSort((current) => ({
      sortBy,
      sortOrder: current.sortBy === sortBy && current.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  return { search, setSearch, page, setPage, sort, changeSort };
}
