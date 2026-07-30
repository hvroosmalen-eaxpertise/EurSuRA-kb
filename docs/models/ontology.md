---
title: Ontology
content_type: model
generated: true
date_updated: 2026-07-30
---

# Ontology: EU Sustainability Reporting Knowledge Base

- **ReportingEntity** (any organisation subject to or engaging with sustainability reporting obligations)
  - **LargeUndertaking** (EU company meeting size thresholds subject to mandatory CSRD obligations)
    - Instance examples: CSRD-obligated companies from January 2024
  - **SmallAndMediumEnterprise** (organisation below large-undertaking thresholds; not directly obligated under CSRD)
    - Instance examples: Bordvol (fictionalised SME evaluating VSME adoption)
  - **MultinationalEnterprise** (enterprise operating across borders subject to OECD Guidelines)
    - Instance examples: enterprises subject to Dutch NCP guidance

---

- **RegulatoryInstrument** (a legally binding rule, directive, or regulation enacted by a competent authority)
  - **EUDirective** (EU legislative act requiring member-state transposition)
    - **CorporateSustainabilityReportingDirective** (EU directive mandating sustainability reporting for large and listed companies from January 2024)
      - Instance examples: CSRD (2023), source: Climate Disclosure Across Frameworks; The SME Reporting Pathway; Double Materiality Across Regimes
  - **EURegulation** (directly applicable EU legislative act)
    - **EUTaxonomyRegulation** (EU regulation classifying environmentally sustainable economic activities; part of Sustainable Finance architecture)
      - Instance examples: EU Taxonomy, source: Climate Disclosure Across Frameworks
    - **ConflictMineralsRegulation** (EU regulation mandating supply-chain due diligence for 3TG minerals)
      - Instance examples: CMR, source: Glossary
    - **SustainableFinanceDisclosureRegulation** (EU regulation requiring financial-product sustainability disclosures)
      - Instance examples: SFDR, source: Climate Disclosure Across Frameworks

---

- **ReportingStandard** (a normative document specifying what and how organisations must or should disclose)
  - **MandatoryStandard** (standard with regulatory enforcement mechanism)
    - **EuropeanSustainabilityReportingStandards** (standards developed by EFRAG under CSRD; mandatory for large undertakings; operationalise double materiality)
      - Instance examples: ESRS (2023), ESRS E1 (climate change and energy), source: Climate Disclosure Across Frameworks; The SME Reporting Pathway; Double Materiality Across Regimes
  - **VoluntaryStandard** (standard with no regulatory enforcement mechanism)
    - **VoluntarySustainabilityReportingStandardForSMEs** (EFRAG standard providing proportionate, ESRS-aligned sustainability reporting for SMEs; published 2024)
      - Instance examples: VSME Basic Module, VSME Extended Module, VSME chapters B2/C2/B3/C3/C4, source: Climate Disclosure Across Frameworks; The SME Reporting Pathway
    - **GHGProtocol** (WRI/WBCSD voluntary methodology standard for measuring Scope 1, 2, and 3 emissions)
      - Instance examples: GHG Protocol, source: Climate Disclosure Across Frameworks
    - **SoftwareCarbonIntensitySpecification** (Green Software Foundation / ISO IEC 21031:2024 methodology for measuring carbon intensity of software systems)
      - Instance examples: SCI v1.1.0; SCI for AI Specification, source: reports\2026\green-software-foundation--sci-for-ai-specification.md; Glossary

---

- **ReportingFramework** (a structured set of principles and guidance for sustainability disclosure, typically voluntary)
  - **TCFD** (Task Force on Climate-Related Financial Disclosures; voluntary for SMEs; focuses on climate-related financial risk under four pillars)
    - Instance examples: TCFD (Financial Stability Board, 2017), source: Climate Disclosure Across Frameworks
  - **GlobalReportingInitiative** (multi-stakeholder voluntary framework centred on outward impact disclosure for broad stakeholder accountability)
    - Instance examples: GRI Standards 2021 edition, source: Double Materiality Across Regimes
  - **UNSustainableDevelopmentGoals** (seventeen goals constituting the overarching global framework for sustainable development through 2030)
    - Instance examples: 2030 Agenda for Sustainable Development (adopted 2015), source: Glossary
  - **OECDGuidelinesForMultinationalEnterprises** (government-backed recommendations for responsible business conduct covering human rights, employment, environment, anti-corruption; last revised 2011)
    - Instance examples: OECD Guidelines (2011), source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md
  - **UNGuidingPrinciplesOnBusinessAndHumanRights** (UN framework articulating state duties and business responsibilities regarding human rights; endorsed 2011)
    - Instance examples: UNGPs (2011), source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md

---

- **MaterialityFramework** (a conceptual and procedural approach for determining what sustainability topics are significant enough to disclose)
  - **DoubleMateriality** (requirement to assess both financial materiality and impact materiality)
    - Instance examples: CSRD/ESRS double materiality requirement, source: Double Materiality Across Regimes; Climate Disclosure Across Frameworks
    - **FinancialMateriality** (assessment of how sustainability factors affect the organisation's own financial position, performance, and cash flows)
      - Instance examples: ESRS financial materiality limb, source: Double Materiality Across Regimes
    - **ImpactMateriality** (assessment of how the organisation's activities affect people and the environment)
      - Instance examples: ESRS impact materiality limb; GRI impact logic, source: Double Materiality Across Regimes
  - **DoubleMaterialityAssessment** (mandatory formal procedural step under ESRS/CSRD evaluating both materiality lenses across all material sustainability topics before determining disclosures)
    - Instance examples: DMA process, source: Climate Disclosure Across Frameworks; Double Materiality Across Regimes; The SME Reporting Pathway
  - **SimplifiedMaterialityProcess** (proportionate materiality process applicable to SMEs under VSME, not requiring a full DMA)
    - Instance examples: VSME materiality process, source: The SME Reporting Pathway

---

- **DueDiligenceProcess** (a continuous process through which enterprises identify, cease, prevent, and mitigate adverse impacts on human rights, labour rights, and the environment)
  - **OECDSixStepFramework** (operationalisation of due diligence into six sequential and iterative steps published by the Dutch NCP)
    - Instance examples: Due Diligence in 6 Stappen (Dutch NCP, September 2021), source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md
    - **Step1_IntegrateCSRPolicy** (develop, endorse, publish and embed a CSR policy into management systems and communicate to suppliers)
      - Instance examples: CSR policy integration step, source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md
    - **Step2_IdentifyAndAssessAdverseImpacts** (conduct CSR risk analysis mapping business activities and relationships for actual or potential adverse impacts)
      - Instance examples: CSR risk analysis step, source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md
  - **InternationalCorporateSocialResponsibility** (overarching concept of responsible enterprise behaviour embedding due diligence obligations)
    - Instance examples: ICSR, source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md

---

- **AdverseImpact** (a negative effect on human rights, labour rights, or the environment caused by, contributed to, or linked to an enterprise)
  - **HumanRightsImpact** (adverse impact specifically affecting human rights or labour rights)
    - Instance examples: impacts identified under UNGPs/OECD Guidelines, source: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md; Glossary
  - **EnvironmentalImpact** (adverse impact on the natural environment)
    - Instance examples: impacts identified under ESRS, OECD Guidelines, source: Glossary; Double Materiality Across Regimes

---

- **EmissionsMeasurementConcept** (a concept, unit, or method used to quantify greenhouse gas or carbon emissions)
  - **GHGScope** (categorisation of emissions by source proximity to the reporting entity)
    - **Scope1Emissions** (direct emissions from owned or controlled sources)
      - Instance examples: GHG Protocol Scope 1, source: Climate Disclosure Across Frameworks
    - **Scope2Emissions** (indirect emissions from purchased energy)
      - Instance examples: GHG Protocol Scope 2, source: Climate Disclosure Across Frameworks
    - **Scope3Emissions** (all other indirect value-chain emissions)
      - Instance examples: GHG Protocol Scope 3, source: Climate Disclosure Across Frameworks
  - **SoftwareCarbonIntensity** (metric normalising software-related carbon emissions against a functional unit, codified in ISO/IEC 21031:2024)
    - Instance examples: SCI score, source: reports\2026\green-software-foundation--sci-for-ai-specification.md
    - **FunctionalUnit** (chosen denominator against which SCI emissions are normalised)
      - Instance examples: functional unit as defined in ISO/IEC 21031:2024, source: reports\2026\green-software-foundation--sci-for-ai-specification.md
  - **CarbonAwareness** (practice of adjusting software energy use based on the carbon intensity of the electricity grid)
    - Instance examples: carbon awareness action (SCI context), source: Glossary
  - **EnergyEfficiency** (reducing the amount of energy consumed to perform a unit of work)
    - Instance examples: software energy efficiency action (SCI context), source: Glossary
  - **HardwareEfficiency** (reducing embodied and operational hardware resource consumption)
    - Instance examples: hardware efficiency action (SCI context), source: Glossary

---

- **AISystem** (a computational system applying machine learning, symbolic, probabilistic, or hybrid techniques to perform tasks)
  - **MachineLearningSystem** (AI system learning patterns from data, including supervised, unsupervised, reinforcement, and deep learning)
    - Instance examples: ML models addressed in SCI for AI Specification, source: reports\2026\green-software-foundation--sci-for-ai-specification.md
  - **GenerativeAISystem** (AI system producing novel content such as text, images, video, music, or code)
    - Instance examples: LLMs, image generators (SCI for AI Specification scope), source: reports\2026\green-software-foundation--sci-for-ai-specification.md
  - **AgenticAISystem** (AI system characterised by autonomous decision-making)
    - Instance examples: agentic AI (SCI for AI Specification scope), source: reports\2026\green-software-foundation--sci-for-ai-specification.md
  - **SymbolicAI** (classical rule-based AI system)
    - Instance examples: symbolic AI (SCI for AI Specification scope), source: reports\2026\green-software-foundation--sci-for-ai-specification.md

---

- **DigitalCompetenceFramework** (a reference framework describing knowledge, skills, and attitudes required for digital competence)
  - **DigComp** (European Digital Competence Framework published by the European Commission JRC)
    - **DigComp3_0** (fifth edition published 2025; incorporates AI, cybersecurity, digital rights, misinformation; introduces learning outcomes approach)
      - Instance examples: DigComp 3.0 (JRC/DG EMPL, 2025), source: reports\2026\jrc144121_01.md
      - **CompetenceArea** (thematic grouping of individual digital competences within DigComp)
        - Instance examples: Information and Data Literacy; Communication and Collaboration; Digital Content Creation; Safety; Problem-Solving, source: reports\2026\jrc144121_01.md
      - **ProficiencyLevel** (structured gradation of digital competence from foundational to highly specialised)
        - Instance examples: DigComp proficiency levels, source: reports\2026\jrc144121_01.md
      - **LearningOutcome** (structured statement of what a learner knows, understands, and can do; introduced in DigComp 3.0)
        - Instance examples: DigComp 3.0 learning outcomes section, source: reports\2026\jrc144121_01.md

---

- **SupplyChainConcept** (a concept relating to the network of upstream and downstream business relationships of an enterprise)
  - **ValueChain** (full upstream and downstream network of business relationships through which an enterprise's products or services pass)
    - Instance examples: ESRS value chain; OECD due diligence value chain, source: Glossary; reports\2026\due-diligence-in-6-stappen-nl-sep2021.md
  - **3TGMinerals** (tin, tantalum, tungsten, and gold subject to mandatory supply-chain due diligence under the Conflict Minerals Regulation)
    - Instance examples: conflict minerals (CMR), source: Glossary
  - **AffectedStakeholders** (individuals or groups such as workers or local communities who bear risks from enterprise activities)
    - Instance examples: affected stakeholders as defined in Glossary, source: Glossary

---

- **KnowledgeBaseArtifact** (a structured document or model produced within or ingested into the EurSuRA knowledge base)
  - **SynthesisPage** (cross-domain insight page combining multiple standards around a practical reporting question; regenerated automatically)
    - Instance examples: Climate Disclosure Across Frameworks; Double Materiality Across Regimes; The SME Reporting Pathway, source: Insights
  - **GeneratedModel** (machine-generated structured representation of knowledge base content)
    - Instance examples: Semantic Model; Concept Map; Ontology; Cross-Reference Matrix, source: Catalog
  - **ReportPage** (auto-generated draft summary of an ingested source document)
    - Instance examples: reports\2026\due-diligence-in-6-stappen-nl-sep2021.md; reports\2026\green-software-foundation--sci-for-ai-specification.md; reports\2026\jrc144121_01.md, source: Reports — 2026
  - **Glossary** (centralised collection of defined terms linked across all knowledge base domains)
    - Instance examples: EurSuRA Glossary, source: Glossary; Home