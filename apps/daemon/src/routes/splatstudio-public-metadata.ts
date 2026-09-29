import type { Express } from 'express';
import type {
  SplatStudioDiscordPresenceResponse,
  SplatStudioGithubLatestReleaseResponse,
  SplatStudioGithubRepoResponse,
} from '@splatstudio/contracts';
import type { RouteDeps } from '../server-context.js';
import {
  SPLATSTUDIO_DISCORD_INVITE_URL,
  type SplatStudioPublicMetadataService,
} from '../services/splatstudio-public-metadata.js';

export interface RegisterSplatStudioPublicMetadataRoutesDeps extends RouteDeps<'http'> {
  openDesignPublicMetadata: SplatStudioPublicMetadataService;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerSplatStudioPublicMetadataRoutes(
  app: Express,
  ctx: RegisterSplatStudioPublicMetadataRoutesDeps,
): void {
  const { openDesignPublicMetadata } = ctx;

  app.get('/api/github/splatstudio', async (_req, res) => {
    try {
      const stats = await openDesignPublicMetadata.readGithubRepoStats();
      const payload: SplatStudioGithubRepoResponse = {
        repo: 'nexu-io/open-design',
        stargazers_count: stats.stargazersCount,
        fetchedAt: stats.fetchedAt,
        stale: stats.stale,
      };
      res.json(payload);
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });

  app.get('/api/github/splatstudio/releases/latest', async (_req, res) => {
    try {
      const release = await openDesignPublicMetadata.readLatestReleaseInfo();
      const payload: SplatStudioGithubLatestReleaseResponse = {
        repo: 'nexu-io/open-design',
        tag_name: release.tagName,
        html_url: release.htmlUrl,
        fetchedAt: release.fetchedAt,
        stale: release.stale,
      };
      res.json(payload);
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });

  app.get('/api/community/discord', async (_req, res) => {
    try {
      const presence = await openDesignPublicMetadata.readDiscordPresence();
      const payload: SplatStudioDiscordPresenceResponse = {
        inviteCode: 'mHAjSMV6gz',
        inviteUrl: SPLATSTUDIO_DISCORD_INVITE_URL,
        onlineCount: presence.onlineCount,
        memberCount: presence.memberCount,
        fetchedAt: presence.fetchedAt,
        stale: presence.stale,
      };
      res.json(payload);
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });
}
