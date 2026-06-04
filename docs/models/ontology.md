---
title: Ontology
content_type: model
status: published
---

# Ontology

This ontology defines the formal vocabulary for the EurSuRA knowledge domain. Each concept is defined with its class, key attributes, and relationships to other concepts.

## Classes

### Regulation

A legally binding instrument adopted by an EU institution that creates obligations for legal persons within its scope.

**Examples:** [[CSRD — Corporate Sustainability Reporting Directive|CSRD]], [[EU Taxonomy Regulation]]
**Attributes:** formal reference (e.g. Directive 2022/2464), entry into force date, scope criteria, phase-in schedule
**Relationships:**
- `mandates` → Standard
- `appliesTo` → ReportingEntity (via scope criteria)

---

### Standard

A technical specification defining the content, structure, and presentation of disclosures. May be mandatory (issued under a regulation) or voluntary.

**Examples:** [[ESRS — European Sustainability Reporting Standards|ESRS]], [[VSME — Voluntary Sustainability Reporting Standard for non-listed SMEs|VSME]], [[GRI — Global Reporting Initiative|GRI Standards]]
**Attributes:** issuing body, version, mandatory/voluntary, effective date
**Relationships:**
- `issuedBy` → StandardsBody
- `contains` → TopicalStandard
- `isInteroperableWith` → Standard (e.g. ESRS ↔ GRI)
- `alignsWith` → Framework

---

### TopicalStandard

A sub-unit of a Standard addressing a specific sustainability topic.

**Examples:** ESRS E1 (Climate Change), ESRS S1 (Own Workforce), GRI 305 (Emissions)
**Attributes:** topic area (E/S/G), ESG pillar, topic name
**Relationships:**
- `partOf` → Standard
- `addresses` → SustainabilityTopic
- `contains` → DisclosureRequirement
- `crossReferences` → TopicalStandard (in other standards)

---

### DisclosureRequirement

An atomic disclosure element: a specific metric, narrative description, or process disclosure that a reporting entity must produce.

**Examples:** ESRS E1-6 (gross Scope 1 GHG emissions), GRI 305-1 (direct Scope 1 GHG emissions)
**Attributes:** identifier, data type (quantitative/qualitative/narrative), unit of measure, mandatory/conditional
**Relationships:**
- `partOf` → TopicalStandard
- `measuredUsing` → Methodology (e.g. GHG Protocol)

---

### SustainabilityTopic

A subject area within the ESG taxonomy that is the unit of materiality assessment and cross-standard mapping.

**Examples:** Climate Change, Pollution, Water and Marine Resources, Biodiversity, Circular Economy, Own Workforce, Business Conduct
**Attributes:** ESG pillar (E/S/G), ESRS code (e.g. E1), GRI Standard code (e.g. 305)
**Relationships:**
- `coveredBy` → TopicalStandard (in multiple standards)
- `mappedTo` → SDG (one or more)
- `assessedAs` → MaterialityDetermination (per ReportingEntity)

---

### MaterialityAssessment

The process through which a reporting entity determines which sustainability topics are material and therefore require disclosure.

**Subtypes:**
- `DoubleMaterialityAssessment` — required under CSRD/ESRS; evaluates both impact materiality and financial materiality
- `SingleMaterialityAssessment` — investor-focused (financial materiality only); used in ISSB/TCFD context

**Attributes:** assessment date, methodology used, stakeholder engagement process
**Relationships:**
- `performedBy` → ReportingEntity
- `produces` → MaterialityDetermination (per topic)

---

### ReportingEntity

An organisation that has a reporting obligation or voluntarily produces a sustainability disclosure.

**Subtypes:**
- `LargeCompany` — CSRD in-scope; must report under ESRS
- `ListedSME` — CSRD phase 3; subject to LSME standard
- `NonListedSME` — CSRD out-of-scope; may use VSME voluntarily
- `FinancialInstitution` — additional SFDR / EU Taxonomy obligations

**Attributes:** legal form, employee count, balance sheet total, turnover, listing status, jurisdiction
**Relationships:**
- `subjectTo` → Regulation
- `voluntarilyApplies` → Standard
- `performs` → MaterialityAssessment
- `produces` → SustainabilityReport
- `partOf` → ValueChain (as supplier or customer)

---

### SustainabilityReport

The document or structured data that a reporting entity produces to satisfy disclosure obligations or voluntary commitments.

**Attributes:** reporting period, assurance level (limited/reasonable), publication date, machine-readable format (XBRL/iXBRL)
**Relationships:**
- `producedBy` → ReportingEntity
- `includes` → Disclosure (per DisclosureRequirement)
- `taggedUsing` → Taxonomy (XBRL taxonomy)

---

### Framework

A voluntary structure that organises sustainability disclosure recommendations without being directly mandated by regulation.

**Examples:** [[TCFD — Task Force on Climate-related Financial Disclosures|TCFD]], [[UN Sustainable Development Goals|UN SDGs]]
**Attributes:** issuing organisation, version, primary audience
**Relationships:**
- `informedBy` → Standard
- `alignsWith` → Standard (e.g. TCFD pillars → ESRS E1)

---

### Methodology

A defined accounting or measurement protocol used to calculate specific metrics.

**Examples:** [[GHG Protocol]], IPCC emission factors, EU Taxonomy technical screening criteria
**Relationships:**
- `usedBy` → DisclosureRequirement
- `specifies` → EmissionsFactor | CalculationMethod

---

## Core Axioms

1. Every DisclosureRequirement belongs to exactly one TopicalStandard.
2. Every TopicalStandard belongs to exactly one Standard.
3. A SustainabilityTopic may be addressed by TopicalStandards from multiple Standards.
4. A MaterialityAssessment determines which SustainabilityTopics are material for a given ReportingEntity.
5. Only material SustainabilityTopics require corresponding Disclosures in the SustainabilityReport (under ESRS).

## See Also

- [[Semantic Model]]
- [[Concept Map]]
- [[Cross-Reference Matrix]]
