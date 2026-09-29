// JSON-file store for licenses + the Ed25519 signing keypair. Atomic writes;
// one process owns the file. Point LICENSE_DATA_DIR at a Railway volume so
// licenses survive restarts (or set LICENSE_PRIVATE_KEY for a fixed keypair).

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { generateSigningKeyPair, loadPrivateKey, loadPublicKey } from './license.ts';
import type { KeyObject } from 'node:crypto';

export interface LicenseRow {
  id: string;
  key: string;
  prefix: string;
  domain: string;
  tier: string;
  tag: string;
  seats: number;
  workspace: string | null;
  email: string | null;
  status: 'active' | 'revoked';
  createdAt: number;
  activations: Array<{ workspace: string; at: number }>;
}

interface State {
  licenses: LicenseRow[];
  revocations: string[];
}

export interface Store {
  readonly dataDir: string;
  privateKey(): KeyObject;
  publicKeyPem(): string;
  list(): LicenseRow[];
  findByKey(key: string): LicenseRow | undefined;
  findById(id: string): LicenseRow | undefined;
  insert(row: Omit<LicenseRow, 'id' | 'createdAt' | 'activations' | 'status'>): LicenseRow;
  activate(key: string, workspace: string): LicenseRow | undefined;
  revoke(id: string): LicenseRow | undefined;
  revocations(): string[];
}

export function createStore(dataDir: string, env: NodeJS.ProcessEnv = process.env): Store {
  mkdirSync(dataDir, { recursive: true });
  const statePath = path.join(dataDir, 'licenses.json');
  const keyPath = path.join(dataDir, 'ed25519-keypair.json');

  let state: State = { licenses: [], revocations: [] };
  if (existsSync(statePath)) {
    try {
      state = JSON.parse(readFileSync(statePath, 'utf8')) as State;
      state.licenses ??= [];
      state.revocations ??= [];
    } catch {
      state = { licenses: [], revocations: [] };
    }
  }

  let keypair: { privateKeyPem: string; publicKeyPem: string };
  if (env.LICENSE_PRIVATE_KEY && env.LICENSE_PRIVATE_KEY.includes('BEGIN')) {
    keypair = { privateKeyPem: env.LICENSE_PRIVATE_KEY, publicKeyPem: env.LICENSE_PUBLIC_KEY ?? '' };
  } else if (existsSync(keyPath)) {
    keypair = JSON.parse(readFileSync(keyPath, 'utf8')) as typeof keypair;
  } else {
    keypair = generateSigningKeyPair();
    writeFileSync(keyPath, JSON.stringify(keypair, null, 2), { mode: 0o600 });
  }

  const privateKey = loadPrivateKey(keypair.privateKeyPem);
  const publicKey = loadPublicKey(keypair.publicKeyPem);

  function persist(): void {
    const tmp = `${statePath}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2));
    renameSync(tmp, statePath);
  }

  return {
    dataDir,
    privateKey: () => privateKey,
    publicKeyPem: () => keypair.publicKeyPem,
    list: () => state.licenses.slice(),
    findByKey: (key) => state.licenses.find((l) => l.key === key.trim().toUpperCase()),
    findById: (id) => state.licenses.find((l) => l.id === id),
    insert(input) {
      const row: LicenseRow = {
        ...input,
        id: randomUUID(),
        status: 'active',
        createdAt: Date.now(),
        activations: [],
      };
      state.licenses.push(row);
      persist();
      return row;
    },
    activate(key, workspace) {
      const row = state.licenses.find((l) => l.key === key.trim().toUpperCase());
      if (!row || row.status === 'revoked' || state.revocations.includes(row.id)) return undefined;
      row.activations.push({ workspace, at: Date.now() });
      persist();
      return row;
    },
    revoke(id) {
      const row = state.licenses.find((l) => l.id === id);
      if (!row) return undefined;
      row.status = 'revoked';
      if (!state.revocations.includes(id)) state.revocations.push(id);
      persist();
      return row;
    },
    revocations: () => state.revocations.slice(),
  };
}
