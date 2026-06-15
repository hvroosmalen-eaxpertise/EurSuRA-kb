---
content_type: report
status: draft
date_added: '2026-06-15'
date_updated: '2026-06-15'
source_file: CSI - Green Software Foundation.pdf
---

# Software Carbon Intensity (SCI) Specification

The **Software Carbon Intensity (SCI)** specification is a methodology standard developed by the Standards Working Group of the [[Green Software Foundation]] for calculating the rate of carbon emissions produced by a software system. Version 1.1.0 of the specification was published on 15 June 2026 and is attributed to [[EFRAG]].[^1] The SCI score is expressed as a rate rather than a total, whereby lower values indicate lower carbon intensity and a score of zero is mathematically unattainable.[^1]

---

## Background

Software systems generate greenhouse gas (GHG) emissions through two primary pathways: the energy consumed during operation of the physical hardware on which the software runs, and the emissions associated with the manufacture and disposal of that hardware.[^1] As digital infrastructure has grown in scale, the carbon footprint attributable to software has become a material concern for climate policy and corporate sustainability reporting. The SCI specification was developed to provide a consistent, comparable, and evidence-based measure that enables software practitioners to understand and reduce their contribution to carbon emissions.[^1]

The specification is designed to complement climate targets focused on the elimination of emissions, such as those defined by science-based target frameworks, by excluding neutralisation and avoidance offsets from its calculation.[^1] This distinguishes the SCI from approaches that permit carbon credits or market-based instruments to lower a reported score.

---

## Scope and Applicability

The SCI methodology applies to any software application, regardless of scale or deployment model. Applicable systems include large distributed cloud architectures, monolithic open-source libraries, on-premises applications, and serverless functions.[^1] The specification is also environment-agnostic, covering personal computers, private data centres, and hyperscale cloud infrastructure.[^1]

The specification is intended for use by all software practitioners. Role-specific applications include the following:[^1]

- **Software programmers**: writing energy-efficient code.
- **Artificial intelligence (AI) and machine learning (ML) developers**: model optimisation, use of pre-trained models, and leveraging optimised hardware for training.
- **Database engineers**: schema design, storage selection, and query optimisation.
- **DevOps practitioners**: creation of carbon-aware pipelines and scheduling of builds to coincide with periods of lower-carbon energy supply.
- **Quality assurance (QA) engineers**: development of energy-efficient test automation and performance testing scripts.
- **Architects**: adoption of serverless or event-driven architectures, infrastructure optimisation, and design for carbon-aware systems.

---

## Terms and Definitions

The specification establishes the following key terms:[^1]

- **Action**: an explicit outcome taken, or change avoided, depending on quantifiable emissions measured by the specification. Actions generally relate to using less electricity, using electricity more intelligently, or using less hardware.
- **Carbon-aware**: an attribute of software or hardware that adjusts its behaviour—including consumption of inputs, processing, or production of outputs—in response to the [[carbon intensity]] of the energy it consumes.
- **Carbon**: used in this specification as a broad term referring to the impact of all types of greenhouse gas emissions and activities on global warming, expressed in carbon dioxide equivalent (CO₂eq) units.

The following symbols are used throughout the specification:

| Symbol | Definition |
|--------|------------|
| E | Energy consumed by a software system |
| I | Region-specific carbon intensity |
| M | Embodied emissions of the hardware |
| O | Operational emissions from energy consumption |
| R | Functional unit |

---

## Software Sustainability Actions

The specification classifies all actions that reduce the carbon emissions of software into three categories:[^1]

1. **Energy Efficiency**: actions taken to reduce the amount of electricity consumed by software to perform the same function.
2. **Hardware Efficiency**: actions taken to reduce the number of physical resources required by software to perform the same function.
3. **Carbon Awareness**: actions taken to time-shift or region-shift computation in order to take advantage of lower-carbon or renewable energy sources.

---

## Calculation Methodology

### Core Equation

The SCI score is defined as a rate: carbon emissions per one functional unit of R.[^1] The core equation is:

```
SCI = C per R
```

Where **C** represents the total carbon emitted by the software system and **R** is the chosen functional unit (for example, per additional user, per application programming interface (API) call, or per ML training run). The equation expands to:

```
SCI = (O + M) per R
```

### Calculation Procedure

The specification prescribes a five-step procedure for calculating and reporting an SCI score:[^1]

1. **Bound**: define the software boundary, identifying which components of the software system are included.
2. **Scale**: select the functional unit that best describes how the application scales.
3. **Define**: for each component within the software boundary, determine the quantification method—either real-world measurements based on telemetry, or lab-based measurements based on models.
4. **Quantify**: calculate a rate for every software component; the total SCI value is the sum of the SCI values for all components.
5. **Report**: disclose the SCI score, the software boundary, and the calculation methodology.

### Operational Emissions

Operational emissions (O) represent the carbon produced by the energy consumed during software execution. They are calculated as:[^1]

```
O = E × I
```

**Energy (E)** is the total energy consumed by a software system for a functional unit of work, measured in kilowatt hours (kWh). Energy consumption must include all energy consumed by hardware that has been reserved or provisioned, not solely the hardware actively used to meet software needs.[^1] The measure may be applied at the level of a data centre, an individual machine (e.g., a virtual machine or node), an individual service (e.g., an API call), or at the level of code execution.[^1]

**Region-specific carbon intensity (I)** is a measure of how much CO₂eq is emitted per kWh of electricity consumed, expressed in grams of carbon per kilowatt hour (gCO₂eq/kWh).[^1] Where electricity consumption is connected to a grid, the short-run marginal, long-run marginal, or average emissions grid intensity of that grid shall be used, excluding any market-based measures.[^1] Where consumption is not connected to a regional grid, an appropriate emissions factor for that system shall be applied. The specification explicitly excludes market-based measures such as renewable energy certificates, making location-based intensity the sole valid basis for this value.[^1]

### Embodied Emissions

Embodied carbon, also referred to as embedded carbon, is the amount of carbon emitted during the creation and disposal of a hardware device.[^1] When software runs on a device, a fraction of that device's total embodied emissions is allocated to the software. This fraction is determined by two factors: the time-share and the resource-share.[^1]

The embodied emissions (M) attributable to a software application are calculated as:[^1]

```
M = TE × TS × RS
```

Which expands to:

```
M = TE × (TiR / EL) × (RR / ToR)
```

Where:

| Variable | Definition |
|----------|------------|
| TE | Total Embodied Emissions: the sum of [[Life Cycle Assessment]] (LCA) emissions for all hardware components |
| TS | Time-share: the proportion of the hardware's total lifespan reserved for use by the software |
| TiR | Time Reserved: the duration for which the hardware is reserved for use by the software |
| EL | Expected Lifespan: the anticipated operational life of the equipment |
| RS | Resource-share: the proportion of total available hardware resources reserved for use by the software |
| RR | Resources Reserved: the number of resources reserved for use by the software |
| ToR | Total Resources: the total number of resources available on the hardware |

As an illustrative example, if a device has embodied carbon of 1,000 kg, an expected lifespan of four years, and is reserved for one hour, the time-share embodied emissions would be approximately 28 g (calculated as 1,000 × 1/(4 × 365 × 24)).[^1]

The specification requires that estimates of all embodied emissions for hardware within the software boundary be included. Where possible, granular data derived from a device's LCA should be used in preference to simplified models.[^1]

### Data Requirements and Modelling

The specification encourages calculation using granular, real-world data. Where access to such data is unavailable—particularly in public cloud environments—users are advised to request the necessary data from their hardware, hosting, or other suppliers.[^1] In circumstances where real-world data cannot be obtained, the SCI permits the use of data generated through modelling and best estimates.[^1]

---

## Exclusions

The specification explicitly excludes neutralisation and avoidance offsets—including carbon credits and market-based instruments such as renewable energy certificates—from reducing an SCI score.[^1] This exclusion is central to the specification's purpose of driving physical emissions reductions rather than permitting accounting-based substitution.

---

## See Also

- [[Green Software Foundation]]
- [[Carbon Intensity]]
- [[Life Cycle Assessment]]
- [[Embodied Carbon]]
- [[Carbon Awareness]]
- [[Science Based Targets initiative (SBTi)]]
- [[Greenhouse Gas Protocol]]

---

## References

[^1]: Green Software Foundation, Standards Working Group. *Software Carbon Intensity (SCI) Specification*, Version 1.1.0. EFRAG, 15 June 2026.