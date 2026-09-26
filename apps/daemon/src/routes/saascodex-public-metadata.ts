import type { Express } from 'express';
import type {
  SaaSCodexDiscordPresenceResponse,
  SaaSCodexGithubLatestReleaseResponse,
  SaaSCodexGithubRepoResponse,
} from '@saascodex/contracts';
import type { RouteDeps } from '../server-context.js';
import {
  SAASCODEX_DISCORD_INVITE_URL,
  type SaaSCodexPublicMetadataService,
} from '../services/saascodex-public-metadata.js';

export interface RegisterSaaSCodexPublicMetadataRoutesDeps extends RouteDeps<'http'> {
  openDesignPublicMetadata: SaaSCodexPublicMetadataService;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerSaaSCodexPublicMetadataRoutes(
  app: Express,
  ctx: RegisterSaaSCodexPublicMetadataRoutesDeps,
): void {
  const { openDesignPublicMetadata } = ctx;

  app.get('/api/github/saascodex', async (_req, res) => {
    try {
      const stats = await openDesignPublicMetadata.readGithubRepoStats();
      const payload: SaaSCodexGithubRepoResponse = {
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

  app.get('/api/github/saascodex/releases/latest', async (_req, res) => {
    try {
      const release = await openDesignPublicMetadata.readLatestReleaseInfo();
      const payload: SaaSCodexGithubLatestReleaseResponse = {
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
      const payload: SaaSCodexDiscordPresenceResponse = {
        inviteCode: 'mHAjSMV6gz',
        inviteUrl: SAASCODEX_DISCORD_INVITE_URL,
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
