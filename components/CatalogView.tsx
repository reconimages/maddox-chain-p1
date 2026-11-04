'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AlbumCard from '@/components/AlbumCard';
import EmptyState from '@/components/EmptyState';

type Album = {
  id: string;
  title: string;
  release_year: number;
  public_track_count: number;
};

export default function CatalogView({ albums, initialType = 'all' }: { albums: Album[]; initialType?: 'all' | 'album' | 'single' }) {
  const [search, setSearch] = useState('');
  const [type, setTypeState] = useState<'all' | 'album' | 'single'>(initialType);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');

  const setType = (next: 'all' | 'album' | 'single') => {
    setTypeState(next);
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') params.delete('type');
    else params.set('type', next);
    const qs = params.toString();
    const url = qs ? `/catalog?${qs}` : '/catalog';
    window.history.replaceState(null, '', url);
  };

  const filtered = albums.filter((a) => {
    if (type === 'album' && a.public_track_count < 2) return false;
    if (type === 'single' && a.public_track_count !== 1) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') {
      if (b.release_year !== a.release_year) return b.release_year - a.release_year;
      return 0;
    }
    if (sort === 'oldest') {
      if (a.release_year !== b.release_year) return a.release_year - b.release_year;
      return 0;
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search albums and singles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Tabs value={type} onValueChange={(v) => setType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="album">Albums</TabsTrigger>
            <TabsTrigger value="single">Singles</TabsTrigger>
          </TabsList>
        </Tabs>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg text-sm px-3 py-2 text-zinc-200"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      <p className="text-sm text-zinc-500 mb-4">
        {sorted.length} {sorted.length === 1 ? 'release' : 'releases'}
      </p>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {sorted.map((a) => (
            <AlbumCard key={a.id} album={{ id: a.id, title: a.title, release_year: a.release_year }} />
          ))}
        </div>
      ) : (
        <EmptyState message={albums.length === 0 ? 'The catalog is empty. Check back soon.' : 'No releases match your search or filter.'} />
      )}
    </div>
  );
}