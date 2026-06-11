---
content_type: report
status: draft
date_added: '2026-06-11'
date_updated: '2026-06-11'
source_file: Green Software Foundation -SCI for AI Specification.md
---

# Software Carbon Intensity for AI Specification

## Lead

The Software Carbon Intensity (SCI) for Artificial Intelligence (AI) Specification is a standardised methodology published by the Green Software Foundation that extends the SCI framework, codified in ISO/IEC 21031:2024, to the distinct characteristics of AI systems.[^1] The specification provides a consistent method for measuring and reporting the carbon emissions associated with AI throughout its lifecycle, from inception to end of life.[^1] It defines persona-based system boundaries, lifecycle stages, and functional units applicable to a broad range of AI paradigms, including classical machine learning, generative AI, and agentic AI.[^1]

---

## Background

The SCI methodology was originally developed to quantify the operational carbon intensity of software systems by normalising emissions against a chosen functional unit.[^1] The formalisation of that methodology as ISO/IEC 21031:2024 established the normative foundation upon which domain-specific extensions can be built.[^1] AI systems present characteristics not fully addressed by general-purpose software carbon accounting, including computationally intensive training phases, large parameter counts, token-based inference patterns, and multi-stage lifecycles that span data collection through model retirement.[^1] The SCI for AI Specification was developed to address these gaps and to incentivise carbon-efficiency improvements across the AI development and deployment landscape.[^1]

---

## Scope

The specification covers a broad spectrum of AI paradigms and application domains.[^1]

### AI Paradigms

The specification encompasses foundational AI approaches, including:[^1]

- **Machine Learning (ML)**, comprising supervised learning, unsupervised learning, [[reinforcement learning]], and deep learning;
- **Symbolic AI** (classical AI);
- **Probabilistic and Bayesian AI**;
- **Evolutionary algorithms**;
- **Fuzzy logic**; and
- **Hybrid AI**, combining multiple paradigms.

### Application-Specific AI Solutions

Application domains within scope include predictive analytics, prescriptive analytics, computer vision, Natural Language Processing (NLP), and speech recognition and processing.[^1]

### Emerging AI Technologies

The specification explicitly addresses generative AI — including text generation (such as Large Language Models, or LLMs), image generation, video generation, music generation, and code generation — as well as agentic AI, characterised by autonomous decision-making.[^1]

---

## Terms and Definitions

The specification adopts all terms and definitions from ISO/IEC 21031:2024 and supplements them with the following AI-specific definitions.[^1]

| Term | Definition |
|---|---|
| Functional Unit | Quantified performance characteristic of an AI system that serves as the reference unit for carbon intensity calculation.[^1] |
| Consumer | Entity that uses AI services and pays for functional units of AI.[^1] |
| Provider | Entity that develops and delivers AI services, selling functional units of AI.[^1] |
| Model Training | Process of developing an AI model by exposing it to data and optimising its parameters to perform a specific task or tasks.[^1] |
| Inference | Process of using a trained AI model to make predictions or generate outputs based on input data.[^1] |
| Token | Atomic unit of text processing in language models, typically representing parts of words or characters.[^1] |
| Parameter | Individual, adjustable value that defines a part of an AI model's structure and behaviour.[^1] |
| FLOP (Floating Point Operation) | Basic computational operation used as a measure of computational work in AI systems.[^1] |

---

## AI Lifecycle Stages

For the purpose of measuring carbon emissions, the specification divides the AI lifecycle into five stages.[^1]

### Inception

The Inception stage involves defining the AI problem, assessing whether AI constitutes an appropriate solution, engaging with end-users, and establishing performance objectives and computational constraints.[^1]

### Design and Development

The Design and Development stage encompasses data collection, preprocessing (cleaning and normalising), synthetic data generation, model selection, feature engineering, distributed training setup, evaluation metric definition, resource allocation, benchmarking, and computational resource optimisation.[^1]

### Deployment

The Deployment stage covers the incorporation of the AI model into larger systems, the design of component interactions, connections with external applications, and testing for integration errors prior to deployment.[^1]

### Operation and Monitoring

The Operation and Monitoring stage includes model deployment for inference, orchestration of autonomous workflows and models (as occurs in agentic AI), integration of model tools and services, performance monitoring, maintenance protocol implementation, and the application of operational practices such as FinOps across edge devices, data centres, and cloud environments.[^1]

### End of Life

The End of Life stage involves the decommissioning of AI systems no longer maintained in runtime environments and the proper handling of associated resources and data.[^1]

---

## Persona-Based System Boundary Definition

The specification defines carbon accounting boundaries according to two primary personas — Consumer and Provider — each possessing different spheres of control and agency over an AI system's carbon footprint.[^1]

### Consumer Boundary

The Consumer boundary must include all components related to the Operation and Monitoring lifecycle stage, including but not limited to: API and inference, orchestration, scaling, observability and monitoring, data and feature management, storage and artefacts, user experience and client-side components, and model tool and service connectors.[^1]

### Provider Boundary

The Provider boundary must include all components related to the Inception, Design and Development, Deployment, and Retirement lifecycle stages.[^1] This encompasses project scoping and planning systems, data collection systems, data preprocessing and cleaning systems, synthetic data generation, model development and training infrastructure, feature engineering systems, distributed training systems, model evaluation and benchmarking, optimisation and efficiency analysis, system integration and orchestration, testing and validation systems, and model tool systems.[^1]

---

## AI Lifecycle Coverage and Reporting Requirements

### Inception (Provider)

Systems used in the Inception stage must be included in the Provider SCI calculation when material; they may be included when not material.[^1]

### Design and Development (Provider)

All carbon emissions associated with systems used in the Design and Development stage must be included in the Provider SCI calculation.[^1] This includes data collection, preprocessing, and cleaning systems; synthetic data generation; compute, storage, and networking resources for model training; distributed training infrastructure; model selection and benchmarking systems; and evaluation frameworks.[^1] Emissions from model training must be calculated over the entire training duration, accounting for all epochs, steps, parameter updates, intermediate runs, and early stopping phases.[^1]

### Deployment (Provider)

All carbon emissions associated with the Deployment stage must be included in the Provider SCI calculation.[^1]

### Operation and Monitoring (Consumer)

All carbon emissions associated with systems used in the Operation and Monitoring stage must be included in the Consumer SCI calculation.[^1]

### Retirement (Consumer and Provider)

Systems used in the Retirement stage must be included in the SCI calculation when material; they may be included when not material.[^1]

---

## Functional Units

### Consumer Functional Units

Consumer functional units represent the measurable unit of AI service consumption used to normalise carbon emissions within the Consumer boundary.[^1] The functional unit should align with how the AI service is delivered, consumed, or billed.[^1] The specification provides the following suggested, non-exhaustive examples.[^1]

| AI System Type | Suggested Functional Unit |
|---|---|
| Large Language Models (LLMs) | Per token |
| Video generation | Per second |
| Image generation | Per image |
| Agentic AI | Per workflow execution |
| OCR and document analysis | Per page processed |
| Classical ML (e.g., classification) | Per inference |
| Machine translation | Per character translated |
| Speech recognition | Per second of audio processed |
| Text-to-speech | Per character of text processed |

Where an AI service involves multiple model calls, tool invocations, or service integrations, emissions should account for all triggered operations, including model executions, tool usage, retrieval steps, model-to-model exchanges, and any other impacts considered material.[^1]

### Provider Functional Units

Provider functional units must align with one of the following metrics to normalise carbon emissions during AI model training.[^1] The choice of unit should reflect the primary optimisation focus of the provider's system design, training strategy, or architecture.[^1]

| Functional Unit | Description | Efficiency Focus |
|---|---|---|
| Per FLOP | Carbon emissions per floating point operation | Algorithmic and hardware efficiency |
| Per training token | Carbon emissions per token in training data | Data quality and curation efficiency |
| Per parameter | Carbon emissions per billion model parameters | Model architecture efficiency |

#### Guidance on Functional Unit Selection

The specification provides the following guidance on unit selection:[^1]

- **Per FLOP** is best suited for evaluating compute efficiency and incentivises algorithmic improvements and optimised hardware utilisation.
- **Per training token** aligns with data-centric strategies and encourages deduplication, curation, and synthetic augmentation.
- **Per parameter** emphasises compact, purposeful model designs, particularly when adjusted for activation sparsity.

#### Gross and Effective Values

The specification distinguishes between gross and effective values for normalisation purposes.[^1] Gross values refer to total quantities without adjustment — for example, total parameters in the model, total tokens in a raw dataset, or total theoretical FLOPs.[^1] Effective values account for actual usage or meaningful contributions — for example, active parameters used per inference in sparse models, deduplicated or curated tokens, or utilised FLOPs during computation.[^1] Reporting effective values is described as providing a more realistic picture of efficiency by recognising carbon savings from optimisations such as pruning, deduplication, or sparse activations.[^1]

#### Reporting Expectations

Providers must clearly state: the chosen functional unit and the rationale for its selection; whether emissions are normalised using gross or effective values; and any key strategies, assumptions, or methodologies that are material to the reported results or potentially valuable for others to adopt, such as pruning, sparse activation, or synthetic data use.[^1] Reporting multiple functional units is described as encouraged, where feasible, to provide a comprehensive view of efficiency across compute, data, and model design dimensions.[^1]

---

## See Also

- [[Software Carbon Intensity]]
- [[ISO/IEC 21031:2024]]
- [[Green Software Foundation]]
- [[Lifecycle Assessment]]
- [[AI Environmental Impact]]
- [[FinOps]]

---

## References

[^1]: Green Software Foundation. *Software Carbon Intensity for AI Specification*. EFRAG. 11 June 2026.