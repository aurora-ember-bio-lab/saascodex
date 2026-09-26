import { describe, expect, it } from 'vitest';

import {
  buildSocialSharePayload,
  SAASCODEX_GITHUB_REPO_URL,
} from '../src/api/social-share';

describe('social-share contract', () => {
  it('builds SaaSCodex repository share targets', () => {
    const payload = buildSocialSharePayload({
      kind: 'saascodex-repo',
      locale: 'zh-CN',
      title: 'SaaSCodex GitHub',
      text: '推荐 SaaSCodex',
    });

    expect(payload.url).toBe(SAASCODEX_GITHUB_REPO_URL);
    expect(payload.locale).toBe('zh-CN');
    expect(payload.platforms.some((target) => target.platform === 'x' && target.shareUrl?.includes('twitter.com/intent/tweet'))).toBe(true);
    expect(payload.platforms.some((target) => target.platform === 'xiaohongshu' && target.mode === 'copy-open')).toBe(true);
  });

  it('keeps deployed project links and the repo recommendation together', () => {
    const payload = buildSocialSharePayload({
      kind: 'project-html',
      locale: 'en',
      url: 'https://example.com/saascodex-demo',
      title: 'Demo',
      text: `Built with SaaSCodex. Repo: ${SAASCODEX_GITHUB_REPO_URL}`,
      copyText: `Demo\nhttps://example.com/saascodex-demo\n${SAASCODEX_GITHUB_REPO_URL}`,
    });

    expect(payload.url).toBe('https://example.com/saascodex-demo');
    expect(payload.githubRepoUrl).toBe(SAASCODEX_GITHUB_REPO_URL);
    expect(payload.copyText).toContain(SAASCODEX_GITHUB_REPO_URL);
    expect(payload.platforms.find((target) => target.platform === 'telegram')?.shareUrl)
      .toContain('https%3A%2F%2Fexample.com%2Fsaascodex-demo');
  });
});
