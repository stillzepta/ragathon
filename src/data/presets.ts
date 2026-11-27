import { DemoPreset, DomainPack } from '../types';

export const DOMAIN_PACKS: DomainPack[] = [
  {
    id: 'auto',
    label: 'Auto Route',
    tagline: 'Orchestrator detects domain & recruits tools automatically',
    tools: ['intent_router()', 'faiss_rag()', 'web_search()'],
  },
  {
    id: 'security',
    label: 'Security',
    tagline: 'Phishing forensics, URL/SSL inspection & takedown drafts',
    tools: ['check_dns_ssl()', 'trace_redirects()', 'scam_rag()'],
  },
  {
    id: 'ops',
    label: 'Incident Ops',
    tagline: 'Log forensics, runbook RAG & safe rollback verification',
    tools: ['parse_stack_trace()', 'detect_error_spikes()', 'runbook_rag()'],
  },
  {
    id: 'career',
    label: 'Career',
    tagline: 'Resume skill-gap analysis, roadmap & application drafts',
    tools: ['parse_resume_pdf()', 'match_jd_skills()', 'jobs_rag()'],
  },
  {
    id: 'campus',
    label: 'Campus',
    tagline: 'Syllabus RAG, deadline conflict detection & study blocks',
    tools: ['syllabus_rag()', 'detect_schedule_clash()', 'calendar_draft()'],
  },
  {
    id: 'finance',
    label: 'Finance',
    tagline: 'Transaction categorization, anomaly scan & budget guardrails',
    tools: ['parse_csv_ledger()', 'detect_recurring()', 'budget_calc()'],
  },
  {
    id: 'bizintel',
    label: 'BizIntel',
    tagline: 'Competitor research, market gaps & GTM strategy brief',
    tools: ['web_search()', 'competitor_matrix()', 'strategy_rag()'],
  },
];

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'phishing-scam',
    domain: 'security',
    label: 'Audit Phishing Email',
    prompt:
      'Analyze this urgent internship offer email: "Congrats! Confirm your Google Summer Stipend ($2,500) within 2 hours at http://g00gle-careers-verify.xyz/claim-offer and pay the ₹499 verification deposit."',
    timeline: {
      orchestrator: {
        summary: 'Classified as Phishing & Financial Scam. Dispatched Security Pack in parallel.',
        badge: 'Security Pack',
        memorySnapshot: {
          detected_intent: 'phishing_triage',
          extracted_urls: ['http://g00gle-careers-verify.xyz/claim-offer'],
          urgency_signals: ['within 2 hours', 'verification deposit'],
        },
      },
      rag: {
        summary: 'Matched 2 known campus internship scam templates in FAISS vector store.',
        badge: '2 RAG hits',
        ragSources: ['Campus-Scam-Playbook.md#L14', 'MITRE-T1566-Phishing.pdf#P3'],
        memorySnapshot: {
          similarity_score: 0.94,
          matched_pattern: 'Advance-fee fake internship + homoglyph domain',
        },
      },
      tools: {
        summary: 'Ran live DNS/SSL & homoglyph inspection on g00gle-careers-verify.xyz.',
        badge: '3 tools run',
        toolCall: 'check_dns_ssl("g00gle-careers-verify.xyz") → age: 2d, no valid EV SSL, homoglyph "00"',
        memorySnapshot: {
          domain_age_days: 2,
          homoglyph_target: 'google.com',
          tls_valid: false,
          risk_flags: ['new_domain', 'typosquatting', 'unencrypted_http'],
        },
      },
      planner: {
        summary: 'Synthesized threat report (96/100 Risk) and drafted campus security alert.',
        badge: 'Draft v1 → v2',
        memorySnapshot: {
          threat_score: 96,
          verdict: 'CRITICAL_PHISHING',
        },
      },
      criticFirst: {
        summary: 'Rejected v1 (64/100): Missing explicit IOC list & safe user remediation steps.',
        badge: '64/100 · Revising',
      },
      criticFinal: {
        summary: 'Approved v2 (94/100): Verified citations, IOCs, and non-destructive user guidance.',
        badge: '94/100 · Verified',
        memorySnapshot: {
          critic_score: 94,
          checks_passed: ['citations_present', 'iocs_extracted', 'rule_6_gate_attached'],
        },
      },
    },
    result: {
      domain: 'security',
      prompt:
        'Analyze this urgent internship offer email: "Congrats! Confirm your Google Summer Stipend ($2,500) within 2 hours at http://g00gle-careers-verify.xyz/claim-offer and pay the ₹499 verification deposit."',
      criticInitialScore: 64,
      criticFinalScore: 94,
      criticNote:
        'Critic caught missing IOCs and vague user advice in Draft 1 (64/100), forcing Planner to add domain forensics and exact protective steps (94/100).',
      briefTitle: 'Critical Phishing Alert: Fake Internship Homoglyph Campaign',
      briefSections: [
        {
          heading: 'Executive Verdict — 96/100 Risk',
          body: 'This message is a high-confidence advance-fee phishing attack impersonating Google Careers [1]. Legitimate employers never charge verification deposits or enforce 2-hour payment deadlines [2].',
        },
        {
          heading: 'Live Tool Forensics',
          body: 'Domain inspection flagged `g00gle-careers-verify.xyz` as registered 2 days ago with zero-substitution typosquatting (`g00gle`) and no valid HTTPS certificate.',
        },
        {
          heading: 'Recommended Next Steps',
          body: 'Do not click the link or pay ₹499. Quarantine the sender domain and broadcast the warning below to your student/team channel.',
        },
      ],
      citations: [
        {
          id: 1,
          title: 'Campus Internship Scam Playbook',
          source: 'Campus-Scam-Playbook.md · §2.1',
          snippet: 'Lookalike domains using 0/o substitution paired with ₹299–₹999 "refundable verification fees" account for 68% of student phishing.',
        },
        {
          id: 2,
          title: 'MITRE ATT&CK T1566 (Phishing)',
          source: 'MITRE-T1566-Phishing.pdf · p.3',
          snippet: 'Artificial urgency ("within 2 hours") is a primary social-engineering indicator designed to bypass verification.',
        },
      ],
      singleLlmComparison:
        'Single LLM Output (No Tools, No RAG):\n"This email looks suspicious because it asks for ₹499 and uses a strange URL. You should be careful and check if it is real."\n\n❌ Missed 2-day domain age & SSL check\n❌ No cited scam playbook\n❌ No IOC blocklist or human-approved alert draft',
      proposedAction: {
        title: 'Quarantine Domain & Send Campus Security Warning',
        description: 'Requires your approval before broadcasting alert or adding IOC to blocklist.',
        riskLevel: 'High',
        payloadPreview:
          'BLOCK_DOMAIN: g00gle-careers-verify.xyz\nALERT_CHANNEL: #campus-security\nMESSAGE: Warning — Do not open g00gle-careers-verify.xyz (fake internship deposit scam).',
        status: 'pending',
      },
    },
  },
  {
    id: 'ops-outage',
    domain: 'ops',
    label: 'Triage 502 Outage',
    prompt:
      'Production checkout-api is throwing 502 Bad Gateway after deploy v2.14. Logs show: "psycopg2.OperationalError: FATAL: remaining connection slots are reserved" at 01:42 UTC.',
    fileName: 'checkout-api-prod.log',
    timeline: {
      orchestrator: {
        summary: 'Routed to Incident Ops Pack. Assigned Log Forensics + Runbook RAG.',
        badge: 'Ops Pack',
        memorySnapshot: {
          service: 'checkout-api',
          deploy_version: 'v2.14',
          error_code: 502,
        },
      },
      rag: {
        summary: 'Found matching Nov 12 postmortem & Postgres Pool Runbook.',
        badge: '2 RAG hits',
        ragSources: ['SRE-Postgres-Runbook.md#L42', 'Postmortem-Nov12.md#L8'],
        memorySnapshot: {
          past_incident: 'INC-408 (Nov 12)',
          root_cause_match: 'Unclosed SQLAlchemy sessions after worker bump',
        },
      },
      tools: {
        summary: 'Parsed stack trace & correlated v2.14 config diff (pool_size 10 → 50).',
        badge: '2 tools run',
        toolCall: 'check_config_diff("v2.13", "v2.14") → DB_POOL_SIZE jumped 10 → 50 across 8 pods (400 > max 100)',
        memorySnapshot: {
          pods: 8,
          pool_per_pod: 50,
          total_requested: 400,
          postgres_max_connections: 100,
        },
      },
      planner: {
        summary: 'Generated graceful rollback plan + customer status-page update.',
        badge: 'Draft v1 → v2',
      },
      criticFirst: {
        summary: 'Rejected v1 (58/100): Direct DB restart drops in-flight checkout payments.',
        badge: '58/100 · Unsafe',
      },
      criticFinal: {
        summary: 'Approved v2 (95/100): Switched to rolling pod rollback + PgBouncer drain.',
        badge: '95/100 · Safe',
        memorySnapshot: {
          critic_score: 95,
          safety_rule: 'zero_downtime_drain_verified',
        },
      },
    },
    result: {
      domain: 'ops',
      prompt:
        'Production checkout-api is throwing 502 Bad Gateway after deploy v2.14. Logs show: "psycopg2.OperationalError: FATAL: remaining connection slots are reserved" at 01:42 UTC.',
      attachedFileName: 'checkout-api-prod.log',
      criticInitialScore: 58,
      criticFinalScore: 95,
      criticNote:
        'Safety Critic blocked Draft 1 (58/100) because restarting Postgres mid-traffic drops active payments, revising to a zero-downtime rolling rollback (95/100).',
      briefTitle: 'Root Cause Found: Connection Pool Exhaustion in v2.14',
      briefSections: [
        {
          heading: 'Root Cause',
          body: 'Deploy v2.14 raised `DB_POOL_SIZE` from 10 to 50 per pod across 8 pods (400 connections), exceeding Postgres `max_connections=100` [1].',
        },
        {
          heading: 'Safe Remediation Plan',
          body: 'Roll back `checkout-api` to `v2.13` with graceful connection draining rather than restarting the primary database [2].',
        },
      ],
      citations: [
        {
          id: 1,
          title: 'Postmortem INC-408 (Nov 12)',
          source: 'Postmortem-Nov12.md · §3',
          snippet: '8 pods × 50 pool size saturates the 100-connection RDS limit within 90 seconds of traffic.',
        },
        {
          id: 2,
          title: 'SRE Postgres Pool Runbook',
          source: 'SRE-Postgres-Runbook.md · §4.2',
          snippet: 'Never hard-restart primary Postgres during checkout spikes; roll back app pods first.',
        },
      ],
      singleLlmComparison:
        'Single LLM Output:\n"Your database is out of connections. Try restarting PostgreSQL or increasing max_connections."\n\n❌ Missed exact v2.14 config math (8×50=400)\n❌ Suggested unsafe DB restart (data loss risk)',
      proposedAction: {
        title: 'Execute Rolling Rollback to v2.13 & Publish Status Update',
        description: 'Pauses for on-call engineer approval before touching production.',
        riskLevel: 'High',
        payloadPreview:
          'kubectl rollout undo deployment/checkout-api --to-revision=13\nSTATUS_PAGE: "Investigating checkout latency; rollback in progress."',
        status: 'pending',
      },
    },
  },
  {
    id: 'career-match',
    domain: 'career',
    label: 'Review Resume vs JD',
    prompt:
      'Compare my resume against the Backend AI Engineer Intern JD. Identify skill gaps, build a 2-week prep roadmap, and draft a tailored cover note.',
    fileName: 'Aarav_Resume_2026.pdf',
    timeline: {
      orchestrator: {
        summary: 'Activated Career Pack. Dispatched Resume Parser + JD RAG.',
        badge: 'Career Pack',
        memorySnapshot: {
          candidate: 'Aarav S.',
          target_role: 'Backend AI Engineer Intern',
        },
      },
      rag: {
        summary: 'Retrieved 2026 Backend AI Intern rubric & interview benchmarks.',
        badge: '2 RAG hits',
        ragSources: ['AI-Intern-Rubric-2026.pdf#P2', 'FastAPI-Patterns.md#L10'],
      },
      tools: {
        summary: 'Extracted 11 resume skills; scored 78% JD overlap (missing Redis & Docker).',
        badge: '2 tools run',
        toolCall: 'match_jd_skills(resume, jd) → 78% match | gaps: ["Redis caching", "Docker multi-stage"]',
        memorySnapshot: {
          match_score: 78,
          matched: ['Python', 'FastAPI', 'React', 'SQL', 'Gemini API'],
          gaps: ['Redis caching', 'Docker Compose', 'Pytest async'],
        },
      },
      planner: {
        summary: 'Built 14-day gap-closure roadmap + tailored outreach draft.',
        badge: 'Draft v1 → v2',
      },
      criticFirst: {
        summary: 'Rejected v1 (69/100): Cover note sounded generic and omitted concrete project metrics.',
        badge: '69/100 · Revising',
      },
      criticFinal: {
        summary: 'Approved v2 (91/100): Added quantified API latency win & realistic 14-day schedule.',
        badge: '91/100 · Verified',
      },
    },
    result: {
      domain: 'career',
      prompt:
        'Compare my resume against the Backend AI Engineer Intern JD. Identify skill gaps, build a 2-week prep roadmap, and draft a tailored cover note.',
      attachedFileName: 'Aarav_Resume_2026.pdf',
      criticInitialScore: 69,
      criticFinalScore: 91,
      criticNote:
        'Critic rejected generic phrasing in Draft 1 (69/100) and injected quantified project metrics + realistic daily time blocks (91/100).',
      briefTitle: '78% JD Match — 14-Day Prep Roadmap & Application Draft',
      briefSections: [
        {
          heading: 'Skill Gap Analysis',
          body: 'Strong core in Python, FastAPI, and Gemini API [1]. Key missing signals for this JD are Redis response caching and Dockerized deployment [2].',
        },
        {
          heading: '14-Day Sprint Plan',
          body: 'Days 1–4: Add Redis semantic cache to your FastAPI project. Days 5–8: Containerize with multi-stage Dockerfile. Days 9–14: Async Pytest suite + 4 mock system design drills.',
        },
      ],
      citations: [
        {
          id: 1,
          title: 'Parsed Resume (Aarav_Resume_2026.pdf)',
          source: 'Page 1 · Projects',
          snippet: 'Built a FastAPI + React document Q&A tool handling 120 req/min.',
        },
        {
          id: 2,
          title: 'AI Intern Hiring Rubric 2026',
          source: 'AI-Intern-Rubric-2026.pdf · p.2',
          snippet: 'Production readiness signals: containerization (Docker) and rate/cache management (Redis).',
        },
      ],
      singleLlmComparison:
        'Single LLM Output:\n"Your resume looks good! Learn Docker and Redis and write a nice cover letter."\n\n❌ No exact % skill match\n❌ Generic advice without resume-specific metrics',
      proposedAction: {
        title: 'Save Roadmap & Send Application Draft Email',
        description: 'Requires your approval before sending application email or updating tracker.',
        riskLevel: 'Medium',
        payloadPreview:
          'TO: hiring@acme-ai.dev\nSUBJECT: Backend AI Intern — Aarav S. (FastAPI + Multi-Agent Builder)\nBODY: Hi team, I recently built a FastAPI + Redis agent pipeline...',
        status: 'pending',
      },
    },
  },
];
