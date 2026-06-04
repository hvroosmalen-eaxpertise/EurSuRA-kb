---
title: Semantic Model
content_type: model
status: published
---

# Semantic Model

The semantic model describes the key concepts in the EurSuRA knowledge domain and the relationships between them. It serves as the conceptual backbone for mapping standards, frameworks, and reporting obligations.

## Core Concepts

### Reporting Entity

An organisation that has a **reporting obligation** under a regulation or directive, or that voluntarily produces a sustainability report. For EurSuRA, the primary reporting entity is an **SME** (Small and Medium Enterprise).

A reporting entity:
- Is subject to one or more **Regulations** or **Directives**
- May voluntarily apply one or more **Frameworks**
- Produces one or more **Reports**
- Has **Activities** generating **Impacts**

### Regulation / Directive

A legally binding act that imposes disclosure obligations. Examples: [[CSRD — Corporate Sustainability Reporting Directive|CSRD]], [[EU Taxonomy Regulation]].

A regulation:
- Mandates compliance with one or more **Standards**
- Applies to **Reporting Entities** meeting defined thresholds (size, listing status, sector)
- Has a **Scope** (which entities are covered) and a **Phase-in** schedule

### Standard

A set of disclosure requirements that specifies what information a reporting entity must disclose and how. Standards are either mandatory (issued under a regulation) or voluntary.

Examples: [[ESRS — European Sustainability Reporting Standards|ESRS]], [[VSME — Voluntary Sustainability Reporting Standard for non-listed SMEs|VSME]], [[GRI — Global Reporting Initiative|GRI Standards]], [[GHG Protocol]].

A standard:
- Consists of one or more **Topical Standards** or **Modules**
- Contains **Disclosure Requirements**
- Addresses one or more **Sustainability Topics**

### Sustainability Topic

A subject area that a standard or framework addresses. Topics follow the ESG (Environmental, Social, Governance) taxonomy and are the unit of **materiality assessment**.

Examples: Climate Change, Biodiversity, Own Workforce, Business Conduct.

A topic:
- Is covered by one or more **Disclosure Requirements**
- May be cross-referenced across multiple standards (e.g. ESRS E1 ↔ GRI 305 ↔ TCFD ↔ SDG 13)
- Has a **materiality** determination (material or not material) per reporting entity

### Disclosure Requirement

A specific data point, narrative disclosure, or metric that a standard requires a reporting entity to include in its report. Disclosure requirements are the atomic units of reporting.

Examples: ESRS E1-6 (gross GHG emissions Scope 1), GRI 305-1 (direct Scope 1 emissions).

### Impact

An actual or potential effect that the reporting entity's activities have on people or the environment (**impact materiality**), or an actual or potential effect of sustainability matters on the entity's finances (**financial materiality**). The [[Double Materiality]] assessment determines which impacts are material and therefore which topics require disclosure.

### Report

The document (integrated into the management report for CSRD reporters) that contains the disclosures produced by the reporting entity. Reports must be machine-readable (XBRL tags) under CSRD.

## Relationships at a Glance

```
Regulation
  └─ mandates ──► Standard(s)
                     └─ contains ──► Topical Standard(s)
                                        └─ contains ──► Disclosure Requirement(s)
                                                           └─ addresses ──► Topic(s)

Reporting Entity
  ├─ subject to ──► Regulation(s)
  ├─ applies voluntarily ──► Framework(s)
  ├─ performs ──► Materiality Assessment
  │                  └─ identifies ──► Material Topic(s)
  └─ produces ──► Report
                    └─ includes ──► Disclosures (per Disclosure Requirement)

Topic
  └─ cross-referenced across ──► Standards / Frameworks / SDGs
```

## Domain Entities Mapped to Standards

| Concept | CSRD/ESRS | GRI | TCFD | EU Taxonomy | GHG Protocol |
|---|---|---|---|---|---|
| Reporting scope | In-scope companies | Any organisation | Companies with climate risk | Taxonomy-aligned activities | Any organisation |
| Materiality | Double materiality | GRI 3 material topics | Climate risk materiality | DNSH criterion | N/A |
| Climate metric | ESRS E1 | GRI 305 | Metrics & Targets pillar | Climate change mitigation objective | Scope 1/2/3 |
| Governance | ESRS G1 | GRI 2 / 205-206 | Governance pillar | N/A | N/A |
| Social | ESRS S1–S4 | GRI 400 series | N/A | N/A | N/A |
| Biodiversity | ESRS E4 | GRI 304 | Physical risk | Biodiversity objective | N/A |

## See Also

- [[Concept Map]]
- [[Ontology]]
- [[Cross-Reference Matrix]]
- [[ESRS — European Sustainability Reporting Standards]]
