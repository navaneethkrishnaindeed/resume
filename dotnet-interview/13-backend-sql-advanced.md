# 200 Backend & SQL Interview Questions
## Intermediate & Advanced — Language Agnostic

---

## Part 1: SQL & Database (1-60)

### Query Optimization (1-15)

**1. What's the difference between clustered and non-clustered index?**
Clustered: physically reorders table data, one per table. Non-clustered: separate structure pointing to data, multiple allowed.

**2. How do you identify a slow query?**
Execution plan analysis, query profiler, check for table scans, missing indexes, high logical reads, lock waits.

**3. What causes index fragmentation and how to fix it?**
Frequent inserts/updates/deletes cause page splits. Fix with `REBUILD` (offline, full rebuild) or `REORGANIZE` (online, defrag).

**4. Covering index vs composite index?**
Composite: multiple columns in index. Covering: includes all columns needed by query (via INCLUDE), avoids table lookup.

**5. When would an index hurt performance?**
Write-heavy tables (insert/update overhead), low selectivity columns, small tables, too many indexes.

**6. What's parameter sniffing?**
Query plan cached for first parameter values. Bad plans for different parameter distributions. Fix: `OPTION(RECOMPILE)`, plan guides.

**7. How does the query optimizer choose between index seek vs scan?**
Based on selectivity. High selectivity (few rows) = seek. Low selectivity (many rows) = scan may be cheaper.

**8. What's a sargable query?**
Search ARGument ABLE. Predicates that can use indexes. `WHERE col = 5` is sargable. `WHERE YEAR(col) = 2024` is not.

**9. How to optimize `SELECT *`?**
Don't use it. Select only needed columns. Reduces I/O, network transfer, allows covering indexes.

**10. What's the cost of ORDER BY without index?**
Requires sort operation in memory/tempdb. Can be expensive for large datasets. Index on sort columns avoids this.

**11. How to optimize OR conditions?**
Often causes scans. Rewrite as UNION ALL of separate indexed queries, or use computed columns.

**12. What's index intersection?**
Optimizer combines multiple single-column indexes. Generally less efficient than proper composite index.

**13. How does statistics affect query plans?**
Optimizer uses statistics to estimate row counts. Stale statistics = bad cardinality estimates = suboptimal plans.

**14. What's a filtered index?**
Index with WHERE clause. Smaller, more efficient for queries matching the filter. Good for sparse columns.

**15. How to identify missing indexes?**
DMVs (sys.dm_db_missing_index_*), execution plan warnings, query store recommendations.

---

### Transactions & Concurrency (16-30)

**16. Explain isolation levels.**
- READ UNCOMMITTED: dirty reads allowed
- READ COMMITTED: no dirty reads (default)
- REPEATABLE READ: no phantom reads within transaction
- SERIALIZABLE: full isolation, range locks
- SNAPSHOT: row versioning, no locks for reads

**17. What's a dirty read, non-repeatable read, phantom read?**
Dirty: read uncommitted data. Non-repeatable: same query, different results (row changed). Phantom: same query, different row count (rows added/deleted).

**18. How does MVCC work?**
Multi-Version Concurrency Control. Maintains row versions. Readers don't block writers. Used in PostgreSQL, snapshot isolation.

**19. What causes deadlocks and how to prevent?**
Circular lock waits. Prevent: consistent lock ordering, shorter transactions, lower isolation, deadlock retry logic.

**20. Optimistic vs pessimistic locking?**
Pessimistic: lock upfront (SELECT FOR UPDATE). Optimistic: check version at commit, retry on conflict. Optimistic better for low contention.

**21. What's a lock escalation?**
Database converts many row/page locks to table lock when threshold exceeded. Can hurt concurrency.

**22. How to implement optimistic concurrency?**
Version column or timestamp. `UPDATE ... WHERE id = @id AND version = @expected_version`. Check affected rows.

**23. What's SELECT FOR UPDATE?**
Acquires row-level locks preventing other transactions from modifying selected rows until commit.

**24. How do long transactions affect the system?**
Hold locks longer, block others, increase deadlock risk, bloat transaction logs, delay replication.

**25. What's a distributed transaction?**
Transaction spanning multiple databases/services. Requires 2PC (two-phase commit). Avoid if possible — use sagas.

**26. How to handle transaction in microservices?**
Saga pattern (choreography/orchestration), eventual consistency, compensating transactions. Avoid distributed transactions.

**27. What's the transaction log and why it matters?**
Records all changes for durability and recovery. Large transactions = large logs. Affects backup, replication, disk space.

**28. What happens during checkpoint?**
Dirty pages flushed to disk, log truncated. Reduces recovery time after crash.

**29. How to detect blocking queries?**
System views: blocked processes, wait stats, lock monitoring. Kill long-running blockers if needed.

**30. What's a savepoint?**
Partial rollback point within transaction. Rollback to savepoint without aborting entire transaction.

---

### Advanced SQL Patterns (31-45)

**31. How to find gaps in sequences?**
```sql
SELECT a.id + 1 AS gap_start
FROM t a LEFT JOIN t b ON a.id + 1 = b.id
WHERE b.id IS NULL;
```

**32. How to detect consecutive rows (islands)?**
Row number difference trick:
```sql
SELECT *, id - ROW_NUMBER() OVER (ORDER BY id) AS grp
FROM t;
```

**33. Running total with window function?**
```sql
SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)
```

**34. How to pivot rows to columns?**
PIVOT operator or conditional aggregation:
```sql
SELECT id,
  SUM(CASE WHEN type='A' THEN val END) AS A,
  SUM(CASE WHEN type='B' THEN val END) AS B
FROM t GROUP BY id;
```

**35. Recursive CTE use cases?**
Hierarchical data (org charts, categories), graph traversal, generating sequences, bill of materials.

**36. How to get Nth highest salary?**
```sql
SELECT DISTINCT salary FROM employees
ORDER BY salary DESC LIMIT 1 OFFSET N-1;
-- Or with window: WHERE rn = N
```

**37. How to find duplicates?**
```sql
SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1;
```

**38. Self join vs subquery performance?**
Depends on optimizer. Self join often better for correlated operations. Test with execution plans.

**39. UNION vs UNION ALL?**
UNION: removes duplicates (sort/distinct operation). UNION ALL: keeps all, faster. Use UNION ALL unless dedup needed.

**40. What's a lateral join?**
Subquery that references columns from preceding tables. Like correlated subquery but in FROM clause. `CROSS APPLY` / `LATERAL`.

**41. How to implement pagination efficiently?**
Keyset pagination for large datasets:
```sql
WHERE (created_at, id) > (@last_created, @last_id)
ORDER BY created_at, id LIMIT 20;
```
Avoid OFFSET for deep pages.

**42. Median calculation?**
```sql
PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY val)
```

**43. How to update with join?**
```sql
UPDATE t1 SET t1.col = t2.val
FROM t1 JOIN t2 ON t1.id = t2.id;
```

**44. How to delete duplicates keeping one?**
```sql
WITH cte AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY col ORDER BY id) rn FROM t
)
DELETE FROM cte WHERE rn > 1;
```

**45. What's MERGE/UPSERT?**
Single statement for insert-or-update:
```sql
MERGE INTO target USING source ON condition
WHEN MATCHED THEN UPDATE
WHEN NOT MATCHED THEN INSERT;
```

---

### Database Design (46-60)

**46. When to denormalize?**
Read-heavy workloads, complex joins hurting performance, reporting tables, caching layers.

**47. What's a surrogate key vs natural key?**
Surrogate: auto-generated (ID). Natural: business data (email, SSN). Surrogate: simpler, stable. Natural: meaningful, no lookup.

**48. How to design for soft deletes?**
`deleted_at` timestamp or `is_deleted` flag. Add to unique constraints, filter in queries, consider partitioning.

**49. Multi-tenant database strategies?**
- Shared database, shared schema (tenant_id column)
- Shared database, separate schemas
- Separate databases per tenant
Trade-offs: isolation vs resource efficiency.

**50. How to handle hierarchical data?**
Adjacency list (parent_id), nested sets, materialized path, closure table. Choice depends on read/write patterns.

**51. What's database sharding?**
Horizontal partitioning across servers. Shard key determines data location. Challenges: cross-shard queries, rebalancing.

**52. How to choose a shard key?**
High cardinality, even distribution, query locality. Avoid hot spots. Often: tenant_id, user_id, geographic region.

**53. What's a read replica?**
Async copy of primary database for read scaling. Eventual consistency. Route reads to replica, writes to primary.

**54. How to handle schema migrations safely?**
Backward compatible changes, expand-contract pattern, feature flags, blue-green deployments, rollback plan.

**55. What's eventual consistency?**
System will become consistent given enough time. Reads may return stale data. Trade-off for availability/partition tolerance.

**56. CAP theorem explained?**
Distributed system can guarantee only 2 of 3: Consistency, Availability, Partition tolerance. In practice: CP or AP systems.

**57. What's a time-series database?**
Optimized for time-stamped data. Append-heavy, time-based queries, automatic aggregation/retention. Examples: InfluxDB, TimescaleDB.

**58. How to design audit tables?**
Separate audit table, triggers/application-level logging, store: who, what, when, old/new values, operation type.

**59. What's connection pooling?**
Reuse database connections instead of creating new. Reduces overhead. Configure: min/max connections, timeout, idle time.

**60. Database per service vs shared database?**
Per service: loose coupling, independent scaling/deployment. Shared: easier joins, transactions. Microservices prefer per-service.

---

## Part 2: Caching & Redis (61-90)

### Caching Fundamentals (61-75)

**61. Cache-aside vs read-through vs write-through?**
- Cache-aside: app manages cache (check cache → miss → load from DB → populate cache)
- Read-through: cache loads from DB automatically
- Write-through: write to cache and DB synchronously
- Write-behind: write to cache, async to DB

**62. What's cache stampede and how to prevent?**
Many requests hit expired cache simultaneously, all query DB. Prevent: locking, probabilistic early expiration, background refresh.

**63. How to invalidate cache correctly?**
- Time-based expiration (TTL)
- Event-based invalidation (on write)
- Version-based (cache key includes version)
Challenge: distributed invalidation.

**64. What's cache warming?**
Pre-populate cache before traffic hits. On deployment, scheduled jobs, or predictive loading.

**65. LRU vs LFU eviction?**
LRU: Least Recently Used (recency). LFU: Least Frequently Used (frequency). LRU simpler, LFU better for skewed access patterns.

**66. How to handle cache consistency in distributed systems?**
- Accept eventual consistency
- Use distributed cache (Redis cluster)
- Pub/sub for invalidation
- Short TTLs

**67. When NOT to cache?**
Highly dynamic data, low hit ratio, security-sensitive data, data larger than cache, rarely accessed data.

**68. What's the thundering herd problem?**
Similar to stampede. Many processes wake up simultaneously (e.g., cache expiry). Solution: jitter, locking, staggered expiry.

**69. How to cache database queries effectively?**
Cache by query hash, invalidate on table changes, consider query result size, use appropriate TTL.

**70. What's negative caching?**
Cache "not found" results to prevent repeated DB lookups for non-existent data. Use shorter TTL.

**71. Multi-tier caching strategy?**
L1: In-process (fastest, per-instance). L2: Distributed (Redis, shared). L3: CDN (static content). Check L1 → L2 → L3 → origin.

**72. How to size cache appropriately?**
Monitor hit ratio, memory usage, eviction rate. Cache hot data that fits in memory. 80/20 rule often applies.

**73. What's cache serialization overhead?**
Converting objects to/from bytes. Consider: JSON (readable) vs binary (faster). Large objects = more overhead.

**74. How to cache paginated results?**
Cache each page separately, or cache full result and paginate in memory. Consider: invalidation complexity, memory usage.

**75. What's a cache tag?**
Group related cache entries for bulk invalidation. E.g., tag all user-related caches with user_id for easy purge.

---

### Redis Specifics (76-90)

**76. Redis data structures and use cases?**
- Strings: simple cache, counters
- Hashes: objects, user sessions
- Lists: queues, recent items
- Sets: unique items, tags
- Sorted Sets: leaderboards, time-series
- Streams: event logs, messaging

**77. Redis persistence: RDB vs AOF?**
RDB: point-in-time snapshots, compact, faster recovery. AOF: append-only log, more durable, larger files. Use both for safety.

**78. How does Redis handle expiration?**
Lazy expiration (on access) + periodic sampling. Keys may exist briefly after TTL. SCAN for cleanup if needed.

**79. Redis cluster vs sentinel?**
Sentinel: high availability, automatic failover, single master. Cluster: sharding + HA, multiple masters, horizontal scaling.

**80. How to implement distributed lock with Redis?**
```
SET lock:resource UUID NX EX 30
-- Do work
-- Release: DELETE if UUID matches (Lua script)
```
Use Redlock for multi-node.

**81. Redis transactions (MULTI/EXEC)?**
Queues commands, executes atomically. No rollback on failure. Use WATCH for optimistic locking.

**82. What's Redis pub/sub limitation?**
Fire-and-forget, no persistence. Offline subscribers miss messages. Use Streams for durable messaging.

**83. Redis Streams vs pub/sub vs lists?**
- Pub/sub: real-time, no persistence
- Lists: simple queue, no consumer groups
- Streams: persistent, consumer groups, message acknowledgment

**84. How to implement rate limiting with Redis?**
Sliding window with sorted sets, or token bucket with Lua scripts. `INCR` + `EXPIRE` for simple fixed window.

**85. Redis memory optimization?**
Use appropriate data types, enable compression, set maxmemory policy, use hashes for small objects, expire unused keys.

**86. What's Redis pipelining?**
Batch multiple commands without waiting for responses. Reduces round trips. Good for bulk operations.

**87. How to handle Redis failover in application?**
Retry logic, connection pooling with health checks, read from replicas, circuit breaker pattern.

**88. Redis Lua scripting use cases?**
Atomic operations: compare-and-set, rate limiting, complex transactions. Scripts run atomically on server.

**89. What's hot key problem in Redis?**
Single key accessed too frequently, overloads one shard. Solutions: key splitting, local caching, read replicas.

**90. How to monitor Redis performance?**
`INFO` command, slowlog, memory usage, connected clients, keyspace hits/misses, replication lag.

---

## Part 3: Message Queues & Kafka (91-130)

### Messaging Fundamentals (91-105)

**91. Queue vs topic (pub/sub)?**
Queue: point-to-point, one consumer gets message. Topic: one-to-many, all subscribers get message.

**92. At-least-once vs at-most-once vs exactly-once?**
- At-least-once: may duplicate, no loss (acknowledge after processing)
- At-most-once: may lose, no duplicates (acknowledge before processing)
- Exactly-once: neither loss nor duplicates (hardest, often idempotency + deduplication)

**93. How to achieve exactly-once processing?**
Idempotent consumers + deduplication. Store processed message IDs, transactional outbox, idempotency keys.

**94. What's a dead letter queue (DLQ)?**
Queue for failed messages after max retries. Allows investigation without blocking main queue.

**95. How to order messages in distributed queue?**
Partition by ordering key (e.g., user_id). Messages with same key go to same partition, processed in order.

**96. What's message acknowledgment?**
Consumer confirms successful processing. Unacked messages redelivered. Ack modes: auto, manual, batch.

**97. How to handle poison messages?**
Messages that always fail. Detect via retry count, move to DLQ, alert, don't block queue.

**98. Sync vs async communication trade-offs?**
Sync: simpler, immediate response, tight coupling. Async: decoupled, resilient, complex error handling, eventual consistency.

**99. What's the outbox pattern?**
Write event to outbox table in same transaction as data change. Background process publishes to queue. Ensures consistency.

**100. What's the inbox pattern?**
Store incoming messages in inbox table, process idempotently. Prevents duplicate processing in consumers.

**101. How to implement request-reply over messaging?**
Correlation ID links request to response. Reply-to queue for responses. Timeout handling required.

**102. What's message TTL?**
Time-to-live. Expired messages discarded or moved to DLQ. Prevents processing stale data.

**103. How to handle backpressure?**
Consumer slower than producer. Solutions: rate limiting, buffering, scaling consumers, dropping messages, blocking producers.

**104. What's competing consumers pattern?**
Multiple consumers on same queue for parallel processing. Load balancing built-in. Ensure idempotency.

**105. How to version message schemas?**
Include version in message, backward compatible changes, schema registry, consumer handles multiple versions.

---

### Kafka Deep Dive (106-130)

**106. Kafka architecture components?**
Producers, consumers, brokers (servers), topics (categories), partitions (ordered logs), consumer groups.

**107. What's a Kafka partition?**
Ordered, immutable sequence of messages. Unit of parallelism. Messages identified by offset within partition.

**108. How does Kafka achieve high throughput?**
Sequential disk I/O, zero-copy transfer, batching, compression, partitioning for parallelism.

**109. What's a consumer group?**
Consumers sharing topic consumption. Each partition consumed by one consumer in group. Enables parallel processing.

**110. How does Kafka rebalancing work?**
When consumers join/leave group, partitions redistributed. Can cause brief processing pause. Minimize with sticky assignor.

**111. What's Kafka offset management?**
Consumer tracks position (offset) in each partition. Commit offset after processing. Auto vs manual commit.

**112. What happens if Kafka consumer crashes?**
Uncommitted messages reprocessed (at-least-once). Consumer group rebalances, another consumer takes over partition.

**113. Kafka replication explained?**
Each partition has leader and replicas. Writes go to leader, replicated to followers. ISR (in-sync replicas) for durability.

**114. What's acks configuration in Kafka producer?**
- acks=0: fire and forget
- acks=1: leader acknowledged
- acks=all: all ISR acknowledged (most durable)

**115. How to handle Kafka producer failures?**
Retries with backoff, idempotent producer (exactly-once), transactional producer for atomic writes.

**116. What's Kafka idempotent producer?**
Prevents duplicates from producer retries. Broker deduplicates by producer ID and sequence number.

**117. Kafka transactions use case?**
Atomic writes across multiple partitions/topics. Read-process-write patterns with exactly-once semantics.

**118. What's log compaction in Kafka?**
Retains latest value per key, removes older. Good for changelog topics, state stores. Enabled per topic.

**119. Kafka vs traditional message queue?**
Kafka: log-based, replay possible, high throughput, consumer manages offset. Queue: message deleted after consumption.

**120. What's Kafka Connect?**
Framework for streaming data between Kafka and external systems. Source connectors (into Kafka), sink connectors (out of Kafka).

**121. What's Kafka Streams?**
Client library for stream processing. Stateful operations, windowing, joins. No separate cluster needed.

**122. How to handle Kafka lag?**
Consumer falling behind producer. Monitor lag, scale consumers, optimize processing, increase partitions.

**123. What's a Kafka consumer lag alert threshold?**
Depends on SLA. If processing must be real-time, alert on any lag. For batch, alert on hours of lag.

**124. How to replay Kafka messages?**
Reset consumer offset to earlier position. `--to-earliest`, `--to-datetime`, `--to-offset`. Useful for reprocessing.

**125. Kafka retention policies?**
Time-based (7 days default) or size-based. After retention, messages deleted (or compacted if log compaction).

**126. What's a Kafka partition key?**
Determines which partition receives message. Same key = same partition = ordering. Null key = round-robin.

**127. How many Kafka partitions to create?**
More partitions = more parallelism, but more overhead. Start with consumer count, scale based on throughput needs.

**128. What's Kafka Schema Registry?**
Central schema management for Avro/Protobuf/JSON schemas. Ensures compatibility, versioning, validation.

**129. Kafka consumer polling best practices?**
Long poll interval, process batches, handle rebalance gracefully, commit offsets appropriately.

**130. How to monitor Kafka cluster health?**
Under-replicated partitions, consumer lag, broker disk usage, request latency, ISR shrink events.

---

## Part 4: API & Backend Design (131-170)

### API Design (131-145)

**131. REST vs GraphQL vs gRPC?**
- REST: resource-based, HTTP verbs, simple
- GraphQL: query language, client specifies fields, single endpoint
- gRPC: binary protocol, protobuf, bidirectional streaming, fast

**132. How to version APIs?**
URL path (`/v1/`), header (`Accept-Version`), query param. URL path most common, explicit.

**133. What's idempotency in APIs?**
Same request produces same result. GET, PUT, DELETE naturally idempotent. POST needs idempotency key.

**134. How to implement API pagination?**
- Offset-based: `?page=2&limit=20` (simple, bad for deep pages)
- Cursor-based: `?after=xyz` (stable, efficient)
- Keyset: `?created_after=timestamp&id_after=123` (best performance)

**135. What's HATEOAS?**
Hypermedia As The Engine Of Application State. API responses include links to related actions/resources. Self-documenting.

**136. How to handle partial updates?**
PATCH with partial body. Consider: JSON Patch (operations), JSON Merge Patch (partial object), custom format.

**137. API rate limiting strategies?**
- Fixed window: X requests per minute
- Sliding window: smoother distribution
- Token bucket: allows bursts
- Leaky bucket: constant rate

**138. How to design bulk operations API?**
Batch endpoint accepting array. Return individual results. Consider: partial success handling, async for large batches.

**139. What's API gateway responsibility?**
Authentication, rate limiting, routing, request/response transformation, logging, SSL termination, caching.

**140. How to handle long-running API operations?**
Return 202 Accepted with status URL. Client polls for completion. Or use webhooks for callback.

**141. What's content negotiation?**
Client requests format via `Accept` header. Server responds with `Content-Type`. Supports multiple representations.

**142. How to design error responses?**
Consistent structure: error code, message, details, request ID. Use appropriate HTTP status codes. Machine-readable.

**143. What's API throttling vs rate limiting?**
Rate limiting: cap requests. Throttling: slow down requests. Both protect backend, different approaches.

**144. How to secure APIs?**
HTTPS, authentication (JWT, OAuth), authorization, input validation, rate limiting, CORS, audit logging.

**145. What's API contract testing?**
Verify API meets contract (schema). Consumer-driven contracts. Tools: Pact, OpenAPI validation. Catches breaking changes.

---

### Backend Architecture (146-170)

**146. Monolith vs microservices trade-offs?**
Monolith: simpler deployment, easier debugging, shared database. Microservices: independent scaling, tech flexibility, complex operations.

**147. What's the strangler fig pattern?**
Gradually migrate from monolith. Route traffic to new services incrementally. Reduces big-bang risk.

**148. How to split a monolith?**
Identify bounded contexts, extract by feature, start with loosely coupled parts, use anti-corruption layer.

**149. What's service mesh?**
Infrastructure layer for service-to-service communication. Handles: load balancing, encryption, observability, retries. Examples: Istio, Linkerd.

**150. What's the sidecar pattern?**
Deploy helper container alongside main container. Handles cross-cutting concerns: logging, proxy, monitoring.

**151. How to handle distributed tracing?**
Propagate trace ID across services. Collect spans with timing. Tools: Jaeger, Zipkin, OpenTelemetry.

**152. What's circuit breaker pattern?**
Prevent cascade failures. States: closed (normal), open (failing, fast-fail), half-open (testing recovery). Libraries: Resilience4j, Polly.

**153. How to implement retry with backoff?**
Exponential backoff: 1s, 2s, 4s, 8s... Add jitter to prevent thundering herd. Max retries limit. Idempotent operations only.

**154. What's bulkhead pattern?**
Isolate failures. Separate thread pools/connections per dependency. One failing service doesn't exhaust all resources.

**155. How to handle configuration in distributed systems?**
Centralized config service (Consul, etcd), environment variables, config files with hot reload. Secrets separate.

**156. What's service discovery?**
Services find each other dynamically. Client-side (app queries registry) or server-side (load balancer queries). Tools: Consul, Eureka, Kubernetes DNS.

**157. How to implement health checks?**
Liveness (process alive), readiness (can serve traffic). Check dependencies, don't over-check. Expose /health endpoint.

**158. What's the saga pattern?**
Distributed transaction alternative. Sequence of local transactions with compensating actions for rollback. Choreography or orchestration.

**159. Choreography vs orchestration in sagas?**
Choreography: services react to events, decentralized. Orchestration: central coordinator directs flow. Orchestration easier to understand/debug.

**160. What's eventual consistency and how to handle it?**
Data becomes consistent over time. Design for it: UI shows pending state, retry reads, compensate for conflicts.

**161. How to implement idempotency in services?**
Idempotency key in request, store processed keys with result, return cached result on duplicate.

**162. What's the ambassador pattern?**
Proxy that handles outbound connections. Retry, circuit breaking, logging. Offloads complexity from application.

**163. How to handle cross-cutting concerns?**
Middleware/interceptors, aspect-oriented programming, sidecar containers, shared libraries. Don't duplicate logic.

**164. What's the CQRS pattern?**
Command Query Responsibility Segregation. Separate read and write models. Enables independent scaling, optimization.

**165. When to use event sourcing?**
Audit requirements, temporal queries, event replay, complex domains. Trade-off: complexity, eventual consistency.

**166. What's a projection in event sourcing?**
Read model built by processing events. Can rebuild from event log. Multiple projections for different views.

**167. How to handle event versioning?**
Include version in event, upcasters to transform old events, backward compatible changes, schema registry.

**168. What's domain event vs integration event?**
Domain: within bounded context, internal language. Integration: between contexts, stable contract, avoid leaking internals.

**169. How to test microservices?**
Unit tests, integration tests, contract tests, end-to-end tests (sparingly). Test pyramid applies. Mock external services.

**170. What's the anti-corruption layer?**
Translation layer between contexts. Prevents external models from polluting internal domain. Adapter pattern.

---

## Part 5: System Design & Scalability (171-200)

### Scalability Patterns (171-185)

**171. Horizontal vs vertical scaling?**
Horizontal: add more machines (scale out). Vertical: bigger machine (scale up). Horizontal: more complex, more scalable.

**172. What's a load balancer and algorithms?**
Distributes traffic across servers. Algorithms: round-robin, least connections, weighted, IP hash, least response time.

**173. Sticky sessions pros and cons?**
Pros: simpler state management. Cons: uneven load, failover loses session, limits scaling. Prefer stateless with external session store.

**174. How to scale database reads?**
Read replicas, caching, materialized views, CQRS. Route reads to replicas, accept eventual consistency.

**175. How to scale database writes?**
Sharding, write-behind caching, async processing, command batching. Hardest scaling challenge.

**176. What's database connection pooling?**
Reuse connections instead of creating new. Reduces overhead. Configure min/max, timeout, validation.

**177. How to handle hot spots?**
Shard key producing uneven distribution. Solutions: better shard key, key salting, dedicated resources for hot data.

**178. What's a CDN and when to use?**
Content Delivery Network. Caches content at edge locations. Use for: static assets, media, geographically distributed users.

**179. How to design for high availability?**
Redundancy at every layer, no single points of failure, automatic failover, health checks, multi-region deployment.

**180. What's the difference between failover and failback?**
Failover: switch to backup when primary fails. Failback: return to primary after recovery. Plan and test both.

**181. How to handle datacenter failure?**
Multi-region deployment, data replication, DNS failover, traffic routing. Consider: cost, latency, consistency.

**182. What's chaos engineering?**
Deliberately introduce failures to test resilience. Tools: Chaos Monkey, LitmusChaos. Build confidence in system.

**183. How to implement graceful degradation?**
Reduce functionality instead of complete failure. Disable non-essential features, serve cached content, show degraded UI.

**184. What's backpressure and how to implement?**
Signal overload to upstream. Approaches: blocking, dropping, buffering with limits, rate limiting, load shedding.

**185. How to handle flash crowds?**
Sudden traffic spikes. Solutions: auto-scaling, queue requests, rate limiting, CDN, pre-warming, graceful degradation.

---

### Design Questions (186-200)

**186. Design a URL shortener.**
Key components: ID generation (base62 encoding), key-value store, redirect service, analytics. Consider: collision handling, custom URLs, expiration.

**187. Design a rate limiter.**
Approaches: token bucket, sliding window. Storage: Redis with Lua. Consider: distributed rate limiting, per-user vs global.

**188. Design a distributed cache.**
Consistent hashing for distribution, replication for availability, eviction policies, cache invalidation strategy.

**189. Design a job scheduler.**
Job storage, worker pool, job pickup (locking), retry handling, dead letter queue, priority queues, cron-like scheduling.

**190. Design a notification system.**
Multi-channel (email, SMS, push), template engine, delivery tracking, rate limiting, user preferences, retry logic.

**191. Design a leaderboard.**
Redis sorted sets for real-time. Consider: update frequency, leaderboard size, historical data, tie-breaking.

**192. Design an event-driven order system.**
Events: OrderCreated, PaymentProcessed, InventoryReserved, OrderShipped. Saga for coordination, compensation for failures.

**193. Design a file upload service.**
Direct upload to object storage (S3), presigned URLs, chunked upload for large files, virus scanning, metadata storage.

**194. Design a real-time chat system.**
WebSocket connections, message broker for distribution, presence tracking, message persistence, read receipts.

**195. Design a feed system (Twitter-like).**
Fanout on write (push) vs fanout on read (pull). Consider: celebrity problem, hybrid approach, caching.

**196. Design a search autocomplete.**
Trie data structure, prefix matching, ranking by popularity, caching, personalization.

**197. Design a payment system.**
Idempotency critical, state machine for payment status, reconciliation, audit logging, PCI compliance, retry handling.

**198. Design a metrics collection system.**
Time-series database, high write throughput, aggregation, retention policies, alerting, dashboards.

**199. Design a feature flag system.**
Flag storage, evaluation rules (user targeting), SDK for apps, gradual rollout, kill switch, audit logging.

**200. Design a multi-tenant SaaS platform.**
Tenant isolation strategy (shared vs separate), configuration per tenant, billing, data partitioning, custom domains.

---

## Quick Reference Answers

| Concept | One-liner |
|---------|-----------|
| ACID | Atomicity, Consistency, Isolation, Durability |
| BASE | Basically Available, Soft state, Eventually consistent |
| CAP | Pick 2: Consistency, Availability, Partition tolerance |
| PACELC | If Partition: A vs C. Else: Latency vs Consistency |
| 2PC | Two-phase commit: prepare → commit/rollback |
| Saga | Distributed transaction via local transactions + compensations |
| CQRS | Separate read/write models |
| Event Sourcing | Store events, derive state |
| Idempotency | Same input = same result, safe to retry |
| Circuit Breaker | Fail fast when dependency failing |
| Bulkhead | Isolate failures, limit blast radius |
| Backpressure | Signal overload to slow producers |

---

*200 Questions Complete*
