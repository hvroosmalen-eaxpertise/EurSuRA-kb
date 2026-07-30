---
title: Ontology
content_type: model
generated: true
date_updated: 2026-07-29
---

# Ontology: EU Sustainability Reporting Knowledge Base

- **SustainabilityReportingEntity** (any organisation subject to or engaging with sustainability reporting obligations)
  - **LargeOrListedCompany** (EU company mandated under CSRD from January 2024)
    - Instance examples: CSRD-obligated EU enterprises, listed firms
  - **SmallAndMediumEnterprise (SME)** (organisation not directly captured by CSRD but facing indirect supply-chain pressure)
    - Instance examples: Bordvol (fictionalised tableware/crockery retailer), SME raw-material suppliers, semi-finished-goods producers
  - **MultinationalEnterprise** (enterprise operating across borders, subject to OECD Guidelines)
    - Instance examples: enterprises covered by Dutch NCP guidance

---

- **RegulatoryInstrument** (binding or recommended legal act establishing sustainability obligations)
  - **EUDirective** (legally binding EU legislative act)
    - **CorporateSustainabilityReportingDirective (CSRD)** (EU directive mandating sustainability reporting for large and listed companies from January 2024)
      - Instance examples: CSRD mandatory disclosure regime
    - **EUTaxonomyRegulation** (EU regulation classifying environmentally sustainable economic activities)
      - Instance examples: classification of activities as environmentally sustainable
  - **InternationalGuidelines** (government-backed intergovernmental recommendations)
    - **OECDGuidelinesForMultinationalEnterprises** (2011 OECD recommendations on responsible business conduct covering human rights, labour, environment, anti-corruption)
      - Instance examples: Dutch NCP Six-Step Due Diligence Framework
    - **UNGuidingPrinciplesOnBusinessAndHumanRights (UNGPs)** (UN Human Rights Council 2011 framework on state duties and business responsibilities)
      - Instance examples: UNGPs endorsed 2011
  - **UNAgenda** (universal plan of action adopted by UN member states)
    - **2030AgendaForSustainableDevelopment** (UN 2015 plan establishing the 17 SDGs as the global framework for sustainable development through 2030)
      - Instance examples: SDG-CSRD-ESRS matrix

---

- **ReportingStandard** (structured technical standard or specification defining how to measure and disclose sustainability information)
  - **EuropeanSustainabilityReportingStandards (ESRS)** (EU standards published 2023 operationalising CSRD; require double materiality assessment)
    - **ESRSTopicE1** (climate change and energy topic within ESRS)
      - Instance examples: VSME chapters B2, C2, B3, C3, C4 mapped to E1
  - **VoluntarySustainabilityReportingStandardForSMEs (VSME)** (proportionate voluntary standard published by EFRAG 2024, mapped to ESRS topics)
    - **VSMEBasicModule** (core disclosures covering main sustainability themes; entry point for SMEs)
      - Instance examples: SMEs new to reporting
    - **VSMEExtendedModule** (additional depth for more advanced SME reporters)
      - Instance examples: SMEs with more advanced reporting capacity
  - **GHGProtocol** (technical standard for greenhouse gas emissions accounting underpinning other frameworks)
    - **Scope1Emissions** (direct emissions from owned or controlled sources)
    - **Scope2Emissions** (indirect emissions from purchased energy)
    - **Scope3Emissions** (all other indirect value-chain emissions)
  - **SoftwareCarbonIntensitySpecification (SCI)** (ISO/IEC 21031:2024 methodology quantifying operational carbon intensity of software systems)
    - **SCIforAISpecification** (Green Software Foundation extension of SCI to AI systems across lifecycle stages)
      - Instance examples: ML, generative AI, agentic AI carbon accounting
  - **ConflictMineralsRegulation (CMR)** (mandatory supply chain due diligence regulation for 3TG minerals)
    - Instance examples: tin, tantalum, tungsten, gold (3TG)

---

- **ReportingFramework** (voluntary or market-driven framework structuring sustainability disclosure)
  - **GlobalReportingInitiative (GRI)** (voluntary framework first published 1997, 2021 edition; focuses primarily on impact materiality across economic, environmental, social themes)
    - Instance examples: broad multi-stakeholder accountability reporting
  - **TaskForceOnClimateRelatedFinancialDisclosures (TCFD)** (market/regulatory framework launched 2017 structuring climate disclosure around four pillars)
    - **TCFDPillar_Governance** (disclosure of board and management oversight of climate risks)
    - **TCFDPillar_Strategy** (disclosure of climate risks and opportunities and their strategic implications)
    - **TCFDPillar_RiskManagement** (disclosure of processes for identifying and managing climate risks)
    - **TCFDPillar_MetricsAndTargets** (disclosure of metrics and targets used to assess climate-related risks and opportunities)
      - Instance examples: mandatory for listed firms in UK, Japan, New Zealand
  - **UNSustainableDevelopmentGoals (SDGs)** (17 goals established under the 2030 Agenda providing overarching global framework for sustainable development)
    - Instance examples: SDG-CSRD-ESRS alignment matrix

---

- **MaterialityFramework** (conceptual structure for determining what sustainability information is significant enough to disclose)
  - **DoubleMateriality** (requirement to assess both financial materiality and impact materiality)
    - **FinancialMateriality** (effect of sustainability matters on an organisation's financial position, performance, and cash flows)
      - Instance examples: ESRS required lens, TCFD primary orientation
    - **ImpactMateriality** (organisation's positive or negative effects on people and the environment)
      - Instance examples: ESRS required lens, GRI primary orientation
  - **DoubleMaterialityAssessment (DMA)** (formal process under ESRS/CSRD by which organisations assess both materiality dimensions)
    - Instance examples: required for large companies under CSRD/ESRS

---

- **DueDiligenceProcess** (continuous process for identifying, ceasing, preventing, and mitigating adverse impacts on human rights, labour rights, and the environment)
  - **OECDSixStepFramework** (operationalisation of due diligence published by Dutch NCP)
    - **Step1_IntegrateCSRPolicy** (develop, endorse, publish, and embed a CSR policy based on OECD Guidelines)
    - **Step2_IdentifyAdverseImpacts** (conduct CSR risk analysis mapping activities and relationships)
    - **Step3_CeasePreventMitigate** (act on identified impacts)
    - **Step4_MonitorImplementation** (track effectiveness of due diligence measures)
    - **Step5_Communicate** (report externally on due diligence)
    - **Step6_Remediate** (provide remedy where adverse impacts have occurred)
      - Instance examples: Dutch NCP guidance, September 2021
  - **AdverseImpact** (negative effect on human rights, labour rights, or the environment caused by or linked to an enterprise)
    - Instance examples: negative human rights impacts, environmental harm in value chains
  - **Remediation** (corrective action taken to address adverse impacts that have occurred)

---

- **SupplyChainConcept** (concept relating to the network of entities involved in producing and delivering a product or service)
  - **ValueChain** (full upstream and downstream chain of activities, relationships, and entities associated with an organisation's operations)
    - Instance examples: SME suppliers to CSRD-obligated large companies
  - **BusinessRelationship** (commercial or contractual relationship through which adverse impacts may be linked to an enterprise)
  - **3TGMinerals** (tin, tantalum, tungsten, gold; subject to mandatory supply chain due diligence under CMR)
    - Instance examples: conflict minerals in high-risk areas

---

- **SupportingOrganisation** (body providing standards, guidance, or oversight in the sustainability reporting ecosystem)
  - **EFRAG** (European Financial Reporting Advisory Group; published VSME 2024, developed ESRS)
    - Instance examples: VSME publisher, ESRS technical developer
  - **GreenSoftwareFoundation** (publisher of SCI and SCI for AI specifications)
    - Instance examples: SCI v1.1.0, SCI for AI Specification
  - **DutchNationalContactPoint (NCP)** (Netherlands implementation body for OECD Guidelines; published six-step due diligence framework)
    - Instance examples: Dutch NCP, Ministry of Foreign Affairs
  - **EuropeanCommissionJRC** (Joint Research Centre; publisher of DigComp digital competence framework)
    - Instance examples: DigComp 3.0, published 2025

---

- **DigitalCompetenceFramework** (framework describing knowledge, skills, and attitudes for digital competence)
  - **DigComp3.0** (fifth edition of the European Digital Competence Framework, published 2025 by EC JRC)
    - **DigCompCompetenceArea** (thematic grouping of digital competences within DigComp)
      - Instance examples: information and data literacy, communication and collaboration, digital content creation, safety, problem-solving
    - **DigCompProficiencyLevel** (gradation of digital competence from foundational to highly specialised)
    - **DigCompLearningOutcomes** (new section in DigComp 3.0 providing granular, consistent interpretation of competences)
      - Instance examples: Digital Skills Indicator (DSI) for EU Digital Decade Policy Programme

---

- **AISystemConcept** (concept relating to artificial intelligence systems and their carbon accounting)
  - **AIParadigm** (foundational approach or methodology underlying an AI system)
    - Instance examples: Machine Learning, Symbolic AI, Probabilistic/Bayesian AI, Evolutionary Algorithms, Fuzzy Logic, Hybrid AI
  - **GenerativeAI** (AI systems producing text, image, video, music, or code outputs)
    - Instance examples: Large Language Models (LLMs), image generation, agentic AI
  - **SciAction** (explicit outcome or change avoided, dependent on quantifiable emissions under the SCI specification)
    - Instance examples: using less electricity, using electricity more intelligently, using less hardware