---
title: Ontology
content_type: model
generated: true
date_updated: 2026-06-15
---

# Ontology: Sustainability Knowledge Base

---

- **ReportingObligation** (a formal requirement to disclose sustainability-related information)
  - **MandatoryReporting** (legally compelled disclosure under regulatory instruments)
    - **CSRD** (EU Corporate Sustainability Reporting Directive; mandatory for large and listed EU companies from January 2024)
      - Instance: Large EU companies reporting from January 2024
      - Instance: Listed EU companies reporting from January 2024
    - **ESRS** (European Sustainability Reporting Standards; the technical standards underpinning CSRD disclosure)
      - Instance: ESRS climate disclosures
      - Instance: ESRS governance disclosures
      - Instance: ESRS ten thematic areas (climate change, etc.)
    - **EUTaxonomy** (EU sustainable finance classification system; mandatory for financial-market participants and large CSRD reporters)
      - Instance: Taxonomy-alignment assessments required by financiers
      - Instance: Taxonomy-alignment data requested from SMEs
    - **TCFDMandatoryJurisdictions** (TCFD mandatory for listed companies in specific jurisdictions)
      - Instance: UK mandatory TCFD reporting
      - Instance: Japan mandatory TCFD reporting
      - Instance: New Zealand mandatory TCFD reporting
  - **VoluntaryReporting** (disclosure undertaken without direct legal compulsion)
    - **VSME** (Voluntary Sustainability Reporting Standard for SMEs; published by EFRAG in 2024; proportionate framework mirroring ESRS logic)
      - Instance: VSME Basic module
      - Instance: VSME narrative and policy data aligned to ESRS topic areas
      - Instance: Bordvol (fictionalised SME evaluating VSME adoption)
    - **GRI** (Global Reporting Initiative; first published 1997, 2021 edition current; voluntary, impact-materiality-based framework)
      - Instance: GRI Standards materiality process
      - Instance: GRI economic, environmental, and social themes
    - **TCFD** (Task Force on Climate-Related Financial Disclosures; voluntary for most SMEs; foundational to ISSB standards)
      - Instance: TCFD Governance pillar
      - Instance: TCFD Strategy pillar
      - Instance: TCFD Risk Management pillar
      - Instance: TCFD Metrics and Targets pillar
    - **GHGProtocol** (Greenhouse Gas Protocol; not a legal mandate; measurement methodology underpinning ESRS and TCFD metrics)
      - Instance: Scope 1 emissions accounting
      - Instance: Scope 2 emissions accounting
      - Instance: Scope 3 emissions accounting

---

- **MaterialityFramework** (analytical approach for determining which sustainability topics require disclosure)
  - **DoubleMateriality** (requires assessment of both financial materiality and impact materiality; formally embedded in CSRD/ESRS)
    - **DoubleMaterialityAssessment** (DMA; required analytical step for all entities reporting under ESRS)
      - Instance: Financial materiality dimension (effect of sustainability factors on financial position)
      - Instance: Impact materiality dimension (organisation's effects on people and environment)
  - **ImpactMateriality** (disclosure of how an organisation's activities affect people and the planet; GRI's organising principle)
    - Instance: GRI multi-stakeholder impact disclosure
  - **FinancialMateriality** (single-direction view of how sustainability affects financial performance; used in TCFD and ISSB)
    - Instance: ISSB single-materiality standards

---

- **DueDiligenceFramework** (structured process for identifying, preventing, mitigating, and remediating adverse impacts)
  - **OECDSixStepFramework** (iterative six-step due diligence process published by Dutch NCP for OECD Guidelines)
    - **Step1_PolicyIntegration** (embed CSR policy into management systems and communicate to suppliers)
      - Instance: CSR policy development and publication
      - Instance: Employee training on CSR
    - **Step2_IdentifyAssessImpacts** (conduct CSR risk analysis mapping actual or potential adverse impacts)
      - Instance: CSR risk analysis
      - Instance: Adverse impact identification
    - **Step3_Prioritise** (prioritise identified risks for action)
      - Instance: Risk prioritisation process
    - **Step4_PreventMitigate** (act to prevent or mitigate adverse impacts)
      - Instance: Supplier engagement on adverse impacts
    - **Step5_Monitor** (track effectiveness of measures taken)
      - Instance: Monitoring and evaluation mechanisms
    - **Step6_Communicate** (report on due diligence activities)
      - Instance: Public disclosure of due diligence outcomes
  - **OECDGuidelinesForMNEs** (government-backed recommendations on responsible business conduct; last revised 2011)
    - Instance: Human rights chapter
    - Instance: Environment chapter
    - Instance: Anti-corruption chapter
  - **UNGuidingPrinciples** (UN framework on business and human rights; endorsed by UN Human Rights Council 2011)
    - Instance: State duty to protect human rights
    - Instance: Corporate responsibility to respect human rights
  - **AdverseImpact** (negative effect on human rights, labour rights, or environment caused by enterprise operations or value chain)
    - Instance: Human rights adverse impacts
    - Instance: Environmental adverse impacts
    - Instance: Labour rights adverse impacts
  - **Remediation** (process of addressing and repairing adverse impacts that have occurred)
    - Instance: Grievance mechanisms
    - Instance: Remedy provision to affected stakeholders

---

- **SustainabilityReportingEntity** (an organisation that produces or is subject to sustainability disclosures)
  - **LargeCompany** (meets CSRD thresholds; directly obligated under CSRD/ESRS)
    - Instance: CSRD-obligated undertakings requesting supply-chain data
  - **ListedCompany** (publicly listed; subject to CSRD and potentially TCFD depending on jurisdiction)
  - **SME** (small or medium-sized enterprise; not directly obligated under CSRD but indirectly pressured)
    - Instance: Bordvol (fictionalised SME case study)
    - Instance: SMEs as raw-material suppliers
    - Instance: SMEs as distributors in value chains
  - **FinancialMarketParticipant** (entity subject to EU Taxonomy mandatory requirements)
    - Instance: Banks requesting taxonomy-alignment data from SME clients

---

- **CarbonAccountingMethodology** (systematic method for measuring and reporting greenhouse gas emissions)
  - **GHGProtocolScopes** (scope-based emissions accounting underpinning ESRS and TCFD)
    - Instance: Scope 1 (direct emissions)
    - Instance: Scope 2 (indirect energy emissions)
    - Instance: Scope 3 (value chain emissions)
  - **SoftwareCarbonIntensity** (SCI; methodology for measuring carbon emissions of software systems; codified in ISO/IEC 21031:2024)
    - **SCIforAI** (extension of SCI to AI systems; published by Green Software Foundation)
      - Instance: SCI for classical machine learning
      - Instance: SCI for generative AI (LLMs, image generation, etc.)
      - Instance: SCI for agentic AI
      - Instance: Functional unit normalisation for AI workloads
      - Instance: Lifecycle stages from inception to end of life

---

- **AISystemCategory** (classification of artificial intelligence systems by paradigm or application domain)
  - **MachineLearning** (data-driven AI paradigm encompassing supervised, unsupervised, reinforcement, and deep learning)
    - Instance: Supervised learning
    - Instance: Unsupervised learning
    - Instance: Reinforcement learning
    - Instance: Deep learning
  - **SymbolicAI** (classical rule-based AI)
  - **ProbabilisticAI** (Bayesian and probabilistic methods)
  - **EvolutionaryAlgorithms** (optimisation through simulated evolution)
  - **FuzzyLogic** (reasoning under imprecision)
  - **HybridAI** (combination of multiple AI paradigms)
  - **GenerativeAI** (AI systems producing novel content)
    - Instance: Large Language Models (LLMs)
    - Instance: Image generation models
    - Instance: Video generation models
    - Instance: Music generation models
    - Instance: Code generation models
  - **AgenticAI** (AI characterised by autonomous decision-making)
  - **ApplicationSpecificAI** (AI deployed for defined business or analytical tasks)
    - Instance: Predictive analytics
    - Instance: Prescriptive analytics
    - Instance: Computer vision
    - Instance: Natural Language Processing (NLP)
    - Instance: Speech recognition and processing

---

- **DigitalCompetenceFramework** (reference framework describing knowledge, skills, and attitudes for digital competence)
  - **DigComp3_0** (fifth edition of the European Digital Competence Framework; published 2025 by JRC and DG EMPL)
    - **CompetenceArea** (thematic grouping of related digital competences)
      - Instance: Information and data literacy
      - Instance: Communication and collaboration
      - Instance: Digital content creation
      - Instance: Safety
      - Instance: Problem-solving
    - **ProficiencyLevel** (gradation of digital competence from foundational to highly specialised)
      - Instance: Foundational proficiency
      - Instance: Highly specialised proficiency
    - **LearningOutcome** (structured statements of what a learner knows, understands, and can do; new in DigComp 3.0)
      - Instance: Learning outcomes supporting consistent framework interpretation
  - **PolicyAlignment** (linkage of DigComp 3.0 to European policy instruments)
    - Instance: Union of Skills
    - Instance: Digital Decade Policy Programme
    - Instance: AI Continent Action Plan
    - Instance: European Strategy for a Better Internet for Kids
    - Instance: Digital Skills Indicator (DSI)

---

- **GlobalSustainabilityGoalFramework** (international agenda establishing goals for sustainable development)
  - **UNSDGs** (seventeen Sustainable Development Goals established under the 2030 Agenda; adopted by all UN member states in 2015)
    - Instance: SDG 1 through SDG 17
  - **2030AgendaForSustainableDevelopment** (universal plan of action adopted by UN member states in 2015; overarching framework through to 2030)

---

- **SupplyChainObligation** (requirement imposed on enterprises regarding their upstream or downstream business relationships)
  - **ConflictMineralsRegulation** (EU regulation mandating supply chain due diligence for 3TG minerals from conflict-affected areas)
    - **3TGMinerals** (tin, tantalum, tungsten, gold; subject to mandatory supply chain due diligence)
      - Instance: Tin
      - Instance: Tantalum
      - Instance: Tungsten
      - Instance: Gold
  - **ValueChainDataRequest** (request by CSRD-obligated company to SME suppliers for sustainability data)
    - Instance: Scope 3 data requests to SME suppliers
    - Instance: EU Taxonomy alignment data requests to SMEs