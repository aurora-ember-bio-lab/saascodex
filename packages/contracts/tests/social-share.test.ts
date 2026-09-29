import { describe, expect, it } from 'vitest';

import {
  buildSocialSharePayload,
  SPLATSTUDIO_GITHUB_REPO_URL,
} from '../src/api/social-share';

describe('social-share contract', () => {
  it('builds SplatStudio repository share targets', () => {
    const payload = buildSocialSharePayload({
      kind: 'splatstudio-repo',
      locale: 'zh-CN',
      title: 'SplatStudio GitHub',
      text: '推荐 SplatStudio',
    });

    expect(payload.url).toBe(SPLATSTUDIO_GITHUB_REPO_URL);
    expect(payload.locale).toBe('zh-CN');
    expect(payload.platforms.some((target) => target.platform === 'x' && target.shareUrl?.includes('twitter.com/intent/tweet'))).toBe(true);
    expect(payload.platforms.some((target) => target.platform === 'xiaohongshu' && target.mode === 'copy-open')).toBe(true);
  });

  it('keeps deployed project links and the repo recommendation together', () => {
    const payload = buildSocialSharePayload({
      kind: 'project-html',
      locale: 'en',
      url: 'https://example.com/splatstudio-demo',
      title: 'Demo',
      text: `Built with SplatStudio. Repo: ${SPLATSTUDIO_GITHUB_REPO_URL}`,
      copyText: `Demo\nhttps://example.com/splatstudio-demo\n${SPLATSTUDIO_GITHUB_REPO_URL}`,
    });

    expect(payload.url).toBe('https://example.com/splatstudio-demo');
    expect(payload.githubRepoUrl).toBe(SPLATSTUDIO_GITHUB_REPO_URL);
    expect(payload.copyText).toContain(SPLATSTUDIO_GITHUB_REPO_URL);
    expect(payload.platforms.find((target) => target.platform === 'telegram')?.shareUrl)
      .toContain('https%3A%2F%2Fexample.com%2Fsplatstudio-demo');
  });
});
