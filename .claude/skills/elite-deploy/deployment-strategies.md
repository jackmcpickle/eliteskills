# Deployment Strategies

## Contents
- Atomic deploy (symlink swap)
- Blue-green deploy
- Canary / progressive rollout
- Rolling deploy (orchestrated)
- Docker red/green
- Serverless / edge deploy
- Feature flags
- Comparison matrix

## Atomic Deploy (Symlink Swap)

**How it works:** Upload new release to a versioned directory. Swap a symlink to point to the new version. Rollback = re-point symlink to previous version.

```
/app/
  releases/
    v42/    ← previous
    v43/    ← new
  current → releases/v43   ← symlink
```

**Deploy script:**
```
rsync -az dist/ server:/app/releases/v43/
ssh server "ln -sfn /app/releases/v43 /app/current && systemctl reload app"
```

**Rollback:** `ln -sfn /app/releases/v42 /app/current && systemctl reload app`

**Good for:** Small teams, single server, traditional hosting, VPS.
**Limitations:** Single server, requires shared filesystem for multi-node.

## Blue-Green Deploy

**How it works:** Two identical environments (blue and green). One serves traffic, one is idle. Deploy to idle, verify, switch traffic.

```
                Load Balancer
                    │
            ┌───────┴───────┐
            │               │
         Blue (live)    Green (idle)
            │               │
         v42            ← deploy v43 here
```

**Steps:**
1. Deploy v43 to green (idle)
2. Run smoke tests against green
3. Switch load balancer to green
4. Green is now live, blue is idle
5. If problems → switch back to blue (instant rollback)

**Good for:** Medium teams, stateless apps, when you need instant rollback.
**Limitations:** Double the infrastructure cost. Doesn't work well with stateful apps or database migrations that can't serve both versions.

## Canary / Progressive Rollout

**How it works:** Route a small percentage of traffic to the new version. Monitor error rates and latency. Gradually increase traffic if healthy.

```
Traffic: 100% → v42
         ↓
         5% → v43, 95% → v42   (canary)
         ↓
         25% → v43, 75% → v42  (expanding)
         ↓
         100% → v43             (fully rolled out)
```

**Promotion criteria:**
- Error rate < baseline + 0.1%
- p99 latency < baseline + 20%
- No critical alerts triggered
- Wait period between each step (5-30 minutes)

**Good for:** High-traffic apps, risk-averse teams, when you need data before committing.
**Limitations:** Complex routing infrastructure. Both versions must be compatible (especially for API changes). Requires observability.

## Rolling Deploy (Orchestrated)

**How it works:** Replace instances one at a time (or in batches). Orchestrator manages health checks and traffic shifting.

```
Cluster: [v42] [v42] [v42] [v42]
  →      [v43] [v42] [v42] [v42]  (1 replaced)
  →      [v43] [v43] [v42] [v42]  (2 replaced)
  →      [v43] [v43] [v43] [v42]  (3 replaced)
  →      [v43] [v43] [v43] [v43]  (complete)
```

**Key settings:**
- `maxUnavailable: 1` — at most 1 instance down during rollout
- `maxSurge: 1` — at most 1 extra instance during rollout
- Readiness probes gate traffic (don't send requests until healthy)
- Liveness probes detect stuck instances

**Good for:** Container orchestrators (Kubernetes, ECS, Nomad), microservices.
**Limitations:** Requires orchestrator. Rollback is another rolling deploy (slow). Both versions temporarily coexist.

## Docker Red/Green

Blue-green for Docker without an orchestrator. Simple and effective.

**Steps:**
1. Pull new image: `docker pull app:v43`
2. Start new container on a different port: `docker run -d -p 3001:3000 app:v43`
3. Health check: `curl -f http://localhost:3001/health`
4. Swap reverse proxy to port 3001
5. Stop old container: `docker stop app-v42`

```
# Deploy script
NEW_PORT=3001
OLD_PORT=3000

docker run -d --name app-new -p $NEW_PORT:3000 app:v43
sleep 5
curl -f http://localhost:$NEW_PORT/health || { docker rm -f app-new; exit 1; }

# Swap nginx upstream
sed -i "s/$OLD_PORT/$NEW_PORT/" /etc/nginx/conf.d/app.conf
nginx -s reload

# Cleanup
docker stop app-old && docker rm app-old
docker rename app-new app-old
```

**Good for:** Single-node Docker deployments, homelab, small-scale production.
**Limitations:** Single host. Manual orchestration. No traffic splitting.

## Serverless / Edge Deploy

**How it works:** Deploy immutable function versions. Platform routes traffic instantly. Rollback = point to previous version ID.

```
Deploy v43 → Platform assigns version ID abc123
  Traffic switches immediately (or gradually with traffic splitting)
Rollback → Revert to version ID xyz789 (instant)
```

**Characteristics:**
- Zero-downtime by default (platform handles routing)
- Instant rollback via version ID
- No servers to manage
- Cold starts are the main operational concern

**Good for:** Serverless platforms, edge computing, functions-as-a-service.
**Limitations:** Vendor-specific. Cold start latency. Limited to platform's execution model.

## Feature Flags

Not a deployment strategy by itself — a complement to any strategy above.

**Core idea:** Decouple deployment from release. Code ships dark (disabled), then features are toggled on independently.

```
if (featureFlags.isEnabled("new-checkout", { userId })) {
  return newCheckoutFlow();
} else {
  return legacyCheckoutFlow();
}
```

**Use cases:**
- Gradual rollout to percentage of users
- Beta features for specific users/groups
- Kill switch for problematic features (instant disable, no redeploy)
- A/B testing

**Cleanup:** Feature flags are tech debt. Remove the flag and dead code path within 2 weeks of full rollout.

## Comparison Matrix

| Strategy | Rollback Speed | Complexity | Infra Cost | Best For |
|---|---|---|---|---|
| Atomic (symlink) | Instant | Low | 1x | Single server |
| Blue-green | Instant | Medium | 2x | Stateless apps |
| Canary | Minutes | High | 1.05x | High-traffic |
| Rolling | Minutes | Medium | 1x+ | Orchestrated containers |
| Docker red/green | Seconds | Low | 1x | Single-host Docker |
| Serverless | Instant | Low | Pay-per-use | Edge/FaaS |
| Feature flags | Instant | Medium | 0x | Any (complement) |
