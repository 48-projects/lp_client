'use client';

import { IconBrandGithub } from '@tabler/icons-react';
import Link from 'next/link';
import React from 'react';

import { Container } from '@/components/container';

type GithubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
  followers?: number;
  public_repos?: number;
};

export const GithubProfile = ({ username }: { username: string }) => {
  const [user, setUser] = React.useState<GithubUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      try {
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const json = (await res.json()) as GithubUser;
        if (!cancelled) setUser(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load GitHub user');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <div className="py-10">
      <Container>
        <div className="flex items-center gap-4 border border-neutral-800 bg-neutral-900 rounded-xl p-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user?.name ?? user?.login ?? 'GitHub avatar'}
                className="h-16 w-16 object-cover"
              />
            ) : (
              <IconBrandGithub className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">{user?.name ?? username}</p>
            <p className="text-neutral-400 text-sm">
              @{user?.login ?? username}
            </p>
            {user && (
              <p className="text-neutral-400 text-xs mt-1">
                {user.followers ?? 0} followers • {user.public_repos ?? 0} repos
              </p>
            )}
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <Link
              href={`https://github.com/${username}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-neutral-200"
            >
              <IconBrandGithub className="h-4 w-4" /> Profile
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};
