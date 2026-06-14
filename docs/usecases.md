# GOML Real-World Use Cases

From simplest to most complex production-level scenarios.

---

## Level 1: Personal & Small Projects

### 1. Dotfiles Configuration
Replace `.bashrc`, `.zshrc`, or personal tool configs with GOML.
```
shell {
  theme = dracula
  prompt = "❯ "
  history_size = 10000
  aliases = [ll, la, gs, gp]
}
```
**Why GOML**: Comments work, easy to edit, no syntax errors when tweaking.

### 2. Todo/Note App Config
Simple desktop or CLI app settings.
```
app {
  default_folder = ~/notes
  auto_save = true
  save_interval = 30
  theme = dark
  font_size = 14
}
```

### 3. Game Settings
Player preferences or game configuration files.
```
player {
  name = "Hero"
  difficulty = normal
  volume = 80
  controls {
    jump = space
    attack = left_click
    inventory = tab
  }
}
```

### 4. Environment Variables
Alternative to `.env` files with structure and comments.
```
# Database config
db_host = localhost
db_port = 5432
db_name = myapp

# API keys (use env vars in production)
api_key = ${API_KEY}
secret = ${SECRET}
```

---

## Level 2: Developer Tooling

### 5. Build Tool Configuration
Replace Makefile or build scripts with declarative GOML.
```
build {
  main = ./cmd/server
  output = ./bin/server
  flags = [-ldflags, "-s -w"]
  env {
    CGO_ENABLED = 0
    GOOS = linux
  }
}

targets {
  dev = "go run ./cmd/server"
  test = "go test ./..."
  lint = "golangci-lint run"
  build = "go build -o bin/server ./cmd/server"
}
```

### 6. CI/CD Pipeline Config
Simpler than YAML for GitHub Actions, GitLab CI, etc.
```yaml
# .github/workflows/ci.yml alternative
pipeline {
  name = CI
  
  triggers {
    push = [main, develop]
    pull_request = [main]
  }

  jobs {
    test {
      runs_on = ubuntu-latest
      steps = [checkout, setup-go, test, lint]
    }
    
    deploy {
      runs_on = ubuntu-latest
      needs = [test]
      steps = [checkout, setup-go, build, deploy]
      when = "refs/heads/main"
    }
  }
}
```
**Why GOML**: No YAML indentation issues, comments inline, cleaner syntax.

### 7. Linter/Formatter Config
`.eslintrc`, `.prettierrc`, `golangci.yml` alternatives.
```
linter {
  rules {
    no_unused = error
    no_console = warn
    max_line_length = 120
    indent = 2
    quotes = single
    semicolons = never
  }
  
  ignore = [node_modules, dist, vendor]
}
```

### 8. Project Scaffolding Config
Templates for `yeoman`, `cookiecutter`, or custom generators.
```
scaffold {
  name = "go-api"
  
  files {
    "cmd/server/main.go" = templates/main.go
    "go.mod" = templates/go.mod
    "config.goml" = templates/config.goml
  }
  
  variables {
    module_name = "github.com/user/project"
    author = "Your Name"
    license = MIT
  }
}
```

---

## Level 3: Web Applications

### 9. CMS Content Structure
Blog posts, pages, or content blocks.
```
post {
  title = "Getting Started with GOML"
  slug = getting-started-goml
  date = 2024-01-15
  author = john
  tags = [tutorial, goml, config]
  
  meta {
    description = "Learn GOML in 5 minutes"
    image = /images/goml-hero.png
  }
  
  content = "GOML is a simple data format... Here's how to get started..."
}
```

### 10. E-commerce Product Catalog
Product listings with variants and pricing.
```
products [
  {
    id = PROD-001
    name = "Wireless Mouse"
    slug = wireless-mouse
    price = 29.99
    category = electronics
    
    variants [
      { name = Black, sku = WM-BLK, stock = 50 }
      { name = White, sku = WM-WHT, stock = 30 }
    ]
    
    specs {
      dpi = 1600
      battery = "6 months"
      wireless = true
    }
    
    images = [mouse-1.jpg, mouse-2.jpg, mouse-3.jpg]
  }
]
```

### 11. API Gateway Configuration
Route definitions, middleware, rate limiting.
```
gateway {
  listen = :8080
  
  middleware {
    cors {
      origins = ["*"]
      methods = [GET, POST, PUT, DELETE]
    }
    
    ratelimit {
      requests = 100
      window = 1m
    }
    
    auth {
      type = jwt
      secret = ${JWT_SECRET}
    }
  }

  routes [
    {
      path = /api/users
      method = GET
      handler = listUsers
      rate_limit = 100
    }
    {
      path = /api/users/:id
      method = GET
      handler = getUser
      rate_limit = 200
    }
    {
      path = /api/users
      method = POST
      handler = createUser
      rate_limit = 10
      auth_required = true
    }
  ]
}
```

### 12. Feature Flags & A/B Testing
Runtime feature toggles with user segments.
```
features {
  dark_mode {
    enabled = true
    rollout = 100
  }
  
  new_checkout {
    enabled = true
    rollout = 25
    variants {
      control { weight = 50 }
      variant_a { weight = 30 }
      variant_b { weight = 20 }
    }
    segments {
      beta_users = 100
      premium_users = 50
      free_users = 10
    }
  }
  
  ai_search {
    enabled = false
    rollout = 0
    allowed_users = [admin, beta-tester]
  }
}
```

---

## Level 4: Microservices & Cloud

### 13. Kubernetes Alternative
Simpler alternative to Kubernetes YAML manifests.
```yaml
# deployment.yaml alternative
deployment {
  name = api-server
  namespace = production
  replicas = 3
  
  container {
    name = api
    image = myapp/api:1.2.3
    port = 8080
    
    resources {
      requests { cpu = 100m, memory = 128Mi }
      limits { cpu = 500m, memory = 512Mi }
    }
    
    env {
      DATABASE_URL = ${DATABASE_URL}
      REDIS_URL = ${REDIS_URL}
    }
  }
  
  health {
    liveness = /health
    readiness = /ready
    startup = /startup
  }
  
  autoscale {
    min = 2
    max = 10
    cpu_target = 70
  }
}
```
**Why GOML**: 40% less code than YAML, no indentation errors, comments work.

### 14. Docker Compose Alternative
Service definitions for local development.
```
services {
  web {
    build = .
    ports = ["3000:3000"]
    depends_on = [api, db]
    environment {
      API_URL = http://api:8080
    }
  }
  
  api {
    build = ./api
    ports = ["8080:8080"]
    depends_on = [db, redis]
    volumes = [./api:/app]
  }
  
  db {
    image = postgres:15
    environment {
      POSTGRES_DB = myapp
      POSTGRES_PASSWORD = secret
    }
    volumes = [db_data:/var/lib/postgresql/data]
    ports = ["5432:5432"]
  }
  
  redis {
    image = redis:7-alpine
    ports = ["6379:6379"]
  }
}

volumes {
  db_data
}
```

### 15. Service Mesh Configuration
Istio/Envoy proxy configuration simplified.
```
mesh {
  default_timeout = 10s
  max_retries = 3
  
  services {
    api-gateway {
      routes [
        {
          destination = user-service
          weight = 90
          timeout = 5s
        }
        {
          destination = user-service-v2
          weight = 10
          timeout = 5s
        }
      ]
    }
    
    user-service {
      circuit_breaker {
        max_connections = 100
        max_pending = 50
        timeout = 30s
      }
      
      retry_policy {
        attempts = 3
        retry_on = [5xx, reset, connect-failure]
      }
    }
  }
  
  observability {
    tracing {
      enabled = true
      sampling = 10
    }
    
    metrics {
      enabled = true
      port = 9090
    }
  }
}
```

### 16. Multi-Environment Config Management
Config-as-code for dev/staging/prod with inheritance.
```
# base.goml - shared config
defaults {
  log_level = info
  metrics_port = 9090
  health_port = 8081
}

# production.goml - extends base
production {
  extends = defaults
  
  database {
    host = db.prod.internal
    port = 5432
    pool { min = 10, max = 100 }
    ssl = true
  }
  
  cache {
    redis = cache.prod.internal:6379
    ttl = 3600
  }
  
  features {
    debug = false
    tracing = true
    profiling = false
  }
  
  scaling {
    replicas = 5
    autoscale { min = 3, max = 20 }
  }
}
```

---

## Level 5: Enterprise & Data Platforms

### 17. Data Pipeline Configuration
ETL jobs, data transformations, scheduling.
```
pipeline {
  name = daily-etl
  schedule = "0 2 * * *"
  
  sources {
    orders {
      type = postgres
      connection = ${ORDERS_DB}
      query = "SELECT * FROM orders WHERE date >= CURRENT_DATE - 1"
    }
    
    users {
      type = api
      url = https://api.internal/users
      auth = ${SERVICE_TOKEN}
    }
  }
  
  transforms {
    join {
      source1 = orders
      source2 = users
      on = user_id
    }
    
    aggregate {
      group_by = [category, region]
      metrics {
        total_orders = count(*)
        revenue = sum(amount)
        avg_order = avg(amount)
      }
    }
    
    filter {
      condition = "revenue > 1000"
    }
  }
  
  destinations {
    warehouse {
      type = bigquery
      project = my-project
      dataset = analytics
      table = daily_sales
      write_mode = append
    }
    
    alert {
      type = slack
      channel = data-alerts
      condition = "revenue < 10000"
    }
  }
  
  alerts {
    on_failure {
      type = email
      to = [data-team@company.com]
    }
    
    on_slow {
      threshold = 30m
      type = pagerduty
    }
  }
}
```

### 18. Multi-Tenant SaaS Configuration
Per-tenant feature limits and configuration.
```
tenants {
  starter {
    plan = free
    
    limits {
      users = 5
      storage = 1GB
      api_calls = 1000
      projects = 3
    }
    
    features {
      sso = false
      audit_log = false
      custom_domain = false
      priority_support = false
    }
  }
  
  professional {
    plan = paid
    
    limits {
      users = 50
      storage = 100GB
      api_calls = 100000
      projects = unlimited
    }
    
    features {
      sso = true
      audit_log = true
      custom_domain = true
      priority_support = false
    }
  }
  
  enterprise {
    plan = custom
    
    limits {
      users = unlimited
      storage = unlimited
      api_calls = unlimited
      projects = unlimited
    }
    
    features {
      sso = true
      audit_log = true
      custom_domain = true
      priority_support = true
      on_premise = true
      sla = 99.99
    }
    
    custom {
      data_retention = 7years
      backup_frequency = hourly
      support_response = 1h
    }
  }
}
```

### 19. Infrastructure as Code
Terraform-like infrastructure definitions.
```
infrastructure {
  provider = aws
  region = us-east-1
  
  vpc {
    cidr = 10.0.0.0/16
    subnets {
      public = [10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24]
      private = [10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24]
    }
  }
  
  compute {
    cluster {
      name = production
      node_groups {
        general {
          instance_type = m5.xlarge
          min = 3
          max = 10
          desired = 5
        }
        
        compute {
          instance_type = c5.2xlarge
          min = 2
          max = 20
          desired = 4
          labels = [gpu, compute-intensive]
        }
      }
    }
  }
  
  databases {
    primary {
      engine = postgres
      version = 15
      instance = db.r5.xlarge
      multi_az = true
      backup_retention = 30
    }
    
    cache {
      engine = redis
      version = 7
      node_type = cache.r5.large
      cluster_mode = true
      shards = 3
    }
  }
  
  monitoring {
    cloudwatch {
      retention = 90
      alarms {
        cpu_high { threshold = 80, period = 5m }
        memory_high { threshold = 85, period = 5m }
        disk_high { threshold = 90, period = 10m }
      }
    }
    
    alerting {
      pagerduty { enabled = true }
      slack { channel = "#ops-alerts" }
    }
  }
}
```

### 20. CI/CD Pipeline at Scale
Complex multi-stage, multi-environment deployment pipelines.
```
pipeline {
  name = "Release Pipeline"
  trigger = push_to_main
  
  stages [
    {
      name = build
      parallel = true
      
      jobs {
        go_build {
          matrix {
            os = [linux, darwin, windows]
            arch = [amd64, arm64]
          }
          cache = true
        }
        
        docker_build {
          images = [api, worker, scheduler]
          push_to = registry.company.com
        }
        
        security_scan {
          tools = [trivy, snyk, gosec]
          severity = [critical, high]
        }
      }
    }
    
    {
      name = test
      needs = [build]
      parallel = true
      
      jobs {
        unit_test {
          coverage = 80
          report = codecov
        }
        
        integration_test {
          services = [postgres, redis]
          timeout = 30m
        }
        
        e2e_test {
          browser = chrome
          parallel = 4
          retries = 2
        }
      }
    }
    
    {
      name = deploy_staging
      needs = [test]
      environment = staging
      
      jobs {
        deploy {
          strategy = rolling
          timeout = 10m
        }
        
        smoke_test {
          url = https://staging.company.com
          endpoints = [/health, /api/status]
          timeout = 5m
        }
        
        performance_test {
          tool = k6
          script = ./tests/perf/load.js
          threshold = "p95 < 200ms"
        }
      }
    }
    
    {
      name = deploy_production
      needs = [deploy_staging]
      environment = production
      approval = required
      
      jobs {
        deploy {
          strategy = canary
          canary {
            percentage = 10
            duration = 10m
            metrics = [error_rate, latency]
            rollback_on = [error_rate > 1, p95 > 500ms]
          }
        }
        
        full_rollout {
          after = 30m
          condition = "canary_successful"
        }
      }
      
      rollback {
        automatic = true
        trigger = [health_check_failed, error_spike]
        timeout = 5m
      }
    }
  ]
  
  notifications {
    on_success {
      slack = "#deployments"
      email = [team@company.com]
    }
    
    on_failure {
      slack = "#alerts"
      pagerduty = true
      email = [oncall@company.com]
    }
  }
}
```

---

## Level 6: Mission-Critical Systems

### 21. Global Configuration Service
Centralized config for distributed systems with rollback.
```
config_service {
  version = 3
  last_updated = 2024-01-15T10:30:00Z
  author = platform-team
  
  global {
    region = us-east-1
    environment = production
    cluster = primary
  }
  
  services {
    api {
      replicas = 10
      resources {
        cpu = 4
        memory = 8Gi
      }
      
      config {
        timeout = 30s
        max_connections = 1000
        keep_alive = 60s
      }
    }
  }
  
  database {
    primary {
      host = db-primary.prod.internal
      port = 5432
      pool { min = 20, max = 200 }
    }
    
    replicas [
      { host = db-replica-1.prod.internal, weight = 50 }
      { host = db-replica-2.prod.internal, weight = 30 }
      { host = db-replica-3.prod.internal, weight = 20 }
    ]
  }
  
  cache {
    clusters [
      { host = redis-1.prod.internal, port = 6379 }
      { host = redis-2.prod.internal, port = 6379 }
      { host = redis-3.prod.internal, port = 6379 }
    ]
    strategy = consistent_hash
    ttl = 3600
  }
  
  rollout {
    strategy = canary
    steps = [5, 10, 25, 50, 100]
    interval = 5m
    pause_on_error = true
    auto_rollback = true
    max_rollback_time = 2m
  }
  
  monitoring {
    health_check_interval = 10s
    alert_on = [config_drift, sync_failure]
    dashboard = https://grafana.company.com/config
  }
}
```

### 22. Disaster Recovery Configuration
Backup, failover, and recovery procedures.
```
disaster_recovery {
  rpo = 1h
  rto = 4h
  
  backups {
    database {
      frequency = hourly
      retention = 30d
      location = s3://backups/db
      encryption = aes-256
      verify = true
    }
    
    config {
      frequency = every_change
      retention = 90d
      location = s3://backups/config
      versioned = true
    }
    
    secrets {
      frequency = daily
      retention = 365d
      location = vault://backup/secrets
      encrypt_at_rest = true
    }
  }
  
  failover {
    primary_region = us-east-1
    secondary_region = us-west-2
    
    triggers {
      health_check_failures = 3
      latency_threshold = 5000ms
      error_rate_threshold = 50
    }
    
    dns {
      ttl = 60
      provider = route53
      health_check = /health
    }
    
    database {
      strategy = async_replication
      lag_threshold = 10s
      auto_failover = true
    }
  }
  
  recovery {
    procedures [
      {
        name = database_recovery
        steps = [restore_from_backup, verify_data, switch_connections]
        estimated_time = 30m
      }
      {
        name = full_region_failover
        steps = [activate_secondary, update_dns, verify_services, notify_team]
        estimated_time = 2h
      }
    ]
    
    testing {
      frequency = monthly
      last_test = 2024-01-01
      results = passed
    }
  }
}
```

### 23. Compliance & Audit Configuration
SOC2, GDPR, HIPAA compliance settings.
```
compliance {
  framework = SOC2
  
  data_retention {
    user_data = 7years
    logs = 2years
    backups = 1year
    pii = deleted_after_account_closure
  }
  
  encryption {
    at_rest {
      algorithm = AES-256
      key_rotation = 90d
      hsm_enabled = true
    }
    
    in_transit {
      tls_version = 1.3
      cipher_suites = [TLS_AES_256_GCM_SHA384]
      certificate_rotation = 30d
    }
  }
  
  access_control {
    authentication {
      mfa_required = true
      session_timeout = 30m
      max_sessions = 5
    }
    
    authorization {
      model = RBAC
      roles = [admin, editor, viewer]
      least_privilege = true
    }
    
    audit {
      log_all_access = true
      retention = 2years
      tamper_protection = true
      alert_on = [unusual_access, privilege_escalation]
    }
  }
  
  gdpr {
    data_processing = documented
    consent_required = true
    right_to_erasure = enabled
    data_portability = enabled
    breach_notification = 72h
  }
  
  reporting {
    frequency = quarterly
    auditor = external
    last_audit = 2024-01-01
    findings = [none]
  }
}
```

### 24. Chaos Engineering Configuration
Controlled failure injection for resilience testing.
```
chaos {
  enabled = true
  schedule = "0 2 * * 6"  # Weekly Saturday 2am
  
  experiments [
    {
      name = network_latency
      target = api-gateway
      action {
        type = latency
        duration = 5m
        delay = 200ms
        jitter = 50ms
      }
      blast_radius = 10%
      abort_conditions {
        error_rate > 5%
        p95_latency > 2s
      }
    }
    
    {
      name = pod_failure
      target = user-service
      action {
        type = kill
        instances = 2
        duration = 3m
      }
      blast_radius = 20%
      abort_conditions {
        health_check_failures > 3
      }
    }
    
    {
      name = database_failover
      target = primary-db
      action {
        type = failover
        duration = 10m
      }
      blast_radius = 100%
      abort_conditions {
        data_loss = any
      }
      requires_approval = true
    }
  ]
  
  monitoring {
    real_time_dashboard = true
    metrics = [latency, error_rate, throughput]
    alerting = true
  }
  
  reporting {
    generate_report = true
    include_recommendations = true
    notify = [sre-team@company.com]
  }
}
```

---

## Level 7: Platform Engineering

### 25. Internal Developer Platform
Complete platform configuration for engineering teams.
```
platform {
  name = dev-platform
  version = 2.0
  
  services {
    api_gateway {
      enabled = true
      rate_limiting = true
      authentication = oauth2
      
      routes {
        catalog = /services/*
        docs = /docs/*
        metrics = /metrics/*
      }
    }
    
    service_catalog {
      auto_discovery = true
      health_monitoring = true
      
      templates {
        go_api = templates/go-api
        python_api = templates/python-api
        frontend = templates/react-app
      }
    }
    
    ci_cd {
      provider = github-actions
      auto_build = true
      auto_deploy = true
      
      environments {
        dev { auto_deploy = true }
        staging { auto_deploy = true, approval = false }
        production { auto_deploy = false, approval = true }
      }
    }
    
    observability {
      logging {
        provider = loki
        retention = 30d
        structured = true
      }
      
      tracing {
        provider = tempo
        sampling = 10
      }
      
      metrics {
        provider = prometheus
        retention = 90d
      }
      
      dashboards {
        auto_generate = true
        providers = [grafana]
      }
    }
    
    security {
      vulnerability_scanning = true
      secret_management = vault
      policy_engine = opa
      
      policies [
        { name = no-root-containers, enforce = true }
        { name = require-labels, enforce = true }
        { name = resource-limits, enforce = true }
      ]
    }
  }
  
  self_service {
    enabled = true
    
    actions [
      { name = create_service, approval = false }
      { name = create_database, approval = true }
      { name = scale_service, approval = false }
      { name = access_production, approval = true }
    ]
  }
}
```

### 26. Multi-Region Deployment
Global deployment with region-specific configuration.
```
global {
  project = myplatform
  
  regions {
    us-east-1 {
      primary = true
      weight = 40
      
      infrastructure {
        kubernetes {
          nodes = 20
          instance_type = m5.2xlarge
        }
        
        database {
          instance = db.r5.4xlarge
          multi_az = true
        }
      }
      
      features {
        all = true
      }
    }
    
    eu-west-1 {
      primary = false
      weight = 35
      
      infrastructure {
        kubernetes {
          nodes = 15
          instance_type = m5.xlarge
        }
        
        database {
          instance = db.r5.2xlarge
          multi_az = true
        }
      }
      
      features {
        all = true
        data_residency = eu
        gdpr_mode = strict
      }
    }
    
    ap-southeast-1 {
      primary = false
      weight = 25
      
      infrastructure {
        kubernetes {
          nodes = 10
          instance_type = m5.xlarge
        }
        
        database {
          instance = db.r5.xlarge
          multi_az = true
        }
      }
      
      features {
        all = true
        data_residency = asia
      }
    }
  }
  
  routing {
    strategy = latency_based
    failover = automatic
    health_check_interval = 10s
  }
  
  data_sync {
    strategy = multi_primary
    conflict_resolution = last_write_wins
    sync_interval = 1s
  }
}
```

### 27. Feature Management Platform
Complex feature flags with targeting, segments, and experiments.
```
feature_management {
  environment = production
  
  features {
    new_checkout_flow {
      enabled = true
      
      targeting {
        rules [
          {
            segment = beta_users
            percentage = 100
            variant = new_checkout
          }
          {
            segment = premium_users
            percentage = 50
            variant = new_checkout
          }
          {
            segment = all_users
            percentage = 10
            variant = new_checkout
          }
        ]
        
        default {
          enabled = false
          variant = control
        }
      }
      
      experiments {
        checkout_optimization {
          variants {
            control { weight = 50 }
            simplified { weight = 30 }
            one_click { weight = 20 }
          }
          
          metrics {
            primary = conversion_rate
            secondary = [revenue_per_user, cart_abandonment]
          }
          
          statistical_significance = 95
          min_sample_size = 1000
          max_duration = 14d
        }
      }
      
      guardrails {
        error_rate_threshold = 1%
        latency_impact_threshold = 100ms
        revenue_impact_threshold = -5%
        
        on_breach = rollback
      }
    }
  }
  
  segments {
    beta_users {
      criteria {
        user_id IN beta_list
      }
    }
    
    premium_users {
      criteria {
        plan IN [premium, enterprise]
      }
    }
    
    geographic {
      us_only {
        country = US
      }
      
      eu_only {
        country IN [DE, FR, GB, ES, IT]
      }
    }
  }
  
  audit {
    log_all_changes = true
    retention = 1year
    notify_on = [enable_production, disable_production]
  }
}
```

### 28. Complete Platform Configuration
Entire platform infrastructure in one GOML file.
```
platform {
  name = enterprise-platform
  version = 3.0
  environment = production
  
  networking {
    vpc {
      cidr = 10.0.0.0/16
      
      subnets {
        public = [
          { cidr = 10.0.1.0/24, zone = a }
          { cidr = 10.0.2.0/24, zone = b }
          { cidr = 10.0.3.0/24, zone = c }
        ]
        
        private = [
          { cidr = 10.0.10.0/24, zone = a }
          { cidr = 10.0.11.0/24, zone = b }
          { cidr = 10.0.12.0/24, zone = c }
        ]
      }
    }
    
    load_balancers {
      external {
        type = application
        ssl_cert = arn:aws:acm:us-east-1:123:cert/abc
        waf_enabled = true
      }
      
      internal {
        type = network
        cross_zone = true
      }
    }
  }
  
  compute {
    clusters {
      production {
        node_groups {
          general {
            instance = m5.xlarge
            min = 10
            max = 50
            desired = 20
          }
          
          memory {
            instance = r5.2xlarge
            min = 5
            max = 20
            desired = 8
          }
          
          compute {
            instance = c5.xlarge
            min = 3
            max = 30
            desired = 5
          }
        }
      }
    }
  }
  
  data {
    postgres {
      cluster {
        instances = 3
        instance = db.r5.xlarge
        storage = 1TB
        encryption = true
        backup_retention = 30
      }
    }
    
    redis {
      cluster {
        shards = 3
        replicas_per_shard = 2
        instance = cache.r5.large
      }
    }
    
    elasticsearch {
      nodes = 6
      instance = m5.large.elasticsearch
      storage = 500GB
    }
  }
  
  security {
    authentication {
      provider = auth0
      mfa = required
      session_lifetime = 24h
    }
    
    authorization {
      model = abac
      policy_engine = opa
    }
    
    secrets {
      provider = vault
      auto_rotation = true
    }
    
    compliance {
      frameworks = [SOC2, GDPR, HIPAA]
      scan_on_deploy = true
    }
  }
  
  observability {
    logging {
      aggregate = true
      retention = 90d
      alerting = true
    }
    
    metrics {
      scrape_interval = 15s
      retention = 90d
    }
    
    tracing {
      sampling_rate = 5
      propagation = w3c
    }
  }
}
```

---

## Summary Table

| Level | Use Case | Complexity | Team Size | Scale |
|-------|----------|------------|-----------|-------|
| 1 | Personal configs | Trivial | 1 | KB |
| 2 | Developer tooling | Easy | 1-5 | MB |
| 3 | Web applications | Medium | 5-20 | GB |
| 4 | Microservices | Hard | 10-50 | TB |
| 5 | Enterprise platforms | Very Hard | 50-200 | PB |
| 6 | Mission-critical | Extreme | 200+ | EB |
| 7 | Platform engineering | Maximum | 500+ | Global |

---

## When to Use GOML vs Alternatives

| Scenario | Use GOML | Use JSON | Use YAML | Use TOML |
|----------|----------|----------|----------|----------|
| Config files | ✅ Best | ❌ No comments | ⚠️ Indentation errors | ⚠️ Complex nesting |
| API responses | ⚠️ New format | ✅ Standard | ❌ Not for APIs | ❌ Not for APIs |
| CI/CD pipelines | ✅ Great | ❌ Verbose | ✅ Current standard | ⚠️ Limited |
| Kubernetes | ✅ Better | ❌ Too verbose | ✅ Current standard | ❌ Not supported |
| Documentation | ✅ Great | ❌ No comments | ✅ Good | ⚠️ Limited |
| Feature flags | ✅ Best | ⚠️ No comments | ✅ Good | ⚠️ Complex |
| Package manifests | ✅ Great | ✅ npm uses JSON | ⚠️ Indentation | ✅ Go uses TOML |
