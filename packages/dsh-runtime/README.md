# @saascodex/dsh-runtime

Profile bundle that lets SaaSCodex drive a user-installed DeepSeek Harness
through a strict JSONL stdio protocol. It does not ship the `dsh` executable,
Node.js, credentials, or provider configuration.

Install DeepSeek Harness first. Packaged SaaSCodex builds carry an exact,
integrity-checked tarball of this component. When the DeepSeek Harness card
reports that the connection component is required, selecting the card asks for
confirmation and then invokes the user's own `dsh` to install that tarball into
the `saascodex` profile. SaaSCodex does not download or install `dsh`.

Repository developers can perform the equivalent operation manually:

```sh
pnpm --filter @saascodex/dsh-runtime build
pnpm -C packages/dsh-runtime pack --pack-destination <temporary-directory>
dsh plugin --profile saascodex add <temporary-directory>/saascodex-dsh-runtime-0.1.0.tgz
dsh --profile saascodex --probe
dsh --profile saascodex --models
```

The daemon and `od agent setup deepseek-harness --json` use the same setup
endpoint as the UI. Setup is always explicit on the first incompatible
selection; cancelling does not select the agent or mutate the Harness profile.

The probe prints exactly one JSON object. SaaSCodex starts one short-lived
`dsh --profile saascodex --stdio` process per run; Harness session storage
provides cold resume across later processes.

The models command prints the provider-qualified catalog assembled by the
user's Harness profile. SaaSCodex refreshes this read-only catalog during
agent detection; credentials and secret values are never included.
