---
content_type: report
status: draft
date_added: '2026-06-15'
date_updated: '2026-06-15'
source_file: SCI for Web Assembly Report.pdf
summary: "A Green Software Foundation consensus design for measuring the carbon intensity of WebAssembly web applications."
domain:
- Adjacent
---

# SCI for Web Assembly Report: Consensus Design Document for Measuring Web Application Carbon Intensity

## Lead

The **Software Carbon Intensity (SCI) for Web Assembly Report** is a consensus design document produced by the [Green Software Foundation (GSF)](https://greensoftware.foundation) that establishes requirements for measuring the carbon intensity of browser-based web applications. [^1] Developed in Autumn 2025 through an artificial-intelligence (AI)-orchestrated assembly process involving 14 GSF member participants, the document defines scope, target personas, implementation practices, and evaluation criteria intended to guide a formal SCI for Web specification scheduled for publication in the first quarter of 2026. [^2] The report is hosted at the GSF policy research repository.[^3]

---

## Background

### The Software Carbon Intensity Specification

The **Software Carbon Intensity (SCI)** specification is a methodology developed by the Green Software Foundation for quantifying the carbon emissions associated with software systems. [^4] The SCI for Web initiative extends this parent methodology to address the particular characteristics of browser-mediated applications, which span both server-side infrastructure and client-side browser execution environments. The SCI for Web specification is intended to conform to the parent SCI specification while introducing domain-specific guidance relevant to web delivery. [^5]

### Document Production Process

The Assembly Report was produced in Autumn 2025 using a novel AI-orchestrated consensus process. Participants responded to an initial set of questions by electronic mail; responses were synthesised by a **large language model (LLM)**, which generated candidate content for each numbered section of the document. [^6] Candidate content was reviewed by participants in iterative rounds. Following each review round, a revised candidate entry was generated. In a final round, participants formally indicated one of three positions—**Endorsed**, **Consented**, or **Objected**—with respect to merging proposed content into the draft. Content was merged by the project chair only in the absence of objections. [^7]

A total of 14 participants took part, though the maximum number of active participants in any single review round was seven. [^8] The chair was Chris Adams of the Green Web Foundation. The full list of participants and their affiliations is presented in the table below. [^9]

| Name | Affiliation |
|---|---|
| Chris Adams (Chair) | Green Web Foundation |
| Alekh Gupta | Google |
| Alexander Dawson | ClimateAction.tech |
| Camille Fassett | WattTime |
| Daniel Schien | University of Bristol |
| Facundo Armas | Globant |
| Florent Morel | Amadeus |
| Francesco Fullone | GrUSP |
| Mathias Uhlitzsch | Evosoft |
| Nisha Ramachandra | Accenture |
| Raghava Rao Battina | HSBC |
| Riccardo Pomato | Microsoft |
| Ryan Sholin | Electricity Maps |
| Thiago Falcao Silva | NTT DATA |

---

## Scope Definition

The SCI for Web specification applies to software applications that deliver functional value to human users primarily through browser-based interfaces accessed via the **Hypertext Transfer Protocol (HTTP)** or its encrypted variant **HTTPS**. [^10] According to the document, a web application is characterised by three essential criteria:

1. Content and functionality delivered over HTTP or HTTPS protocols;
2. Rendering and execution occurring primarily within web browser environments or equivalent web rendering engines; and
3. Interfaces designed for direct human interaction and consumption, rather than exclusively machine-to-machine communication. [^11]

The scope encompasses the full spectrum of browser-based applications regardless of architectural complexity, including static content websites, dynamic platforms, **single-page applications (SPAs)**, server-side rendered applications, e-commerce systems, media streaming services, and real-time collaborative tools. [^12] The document states that the distinguishing principle is "browser-mediated human interaction": if users primarily access functionality through web browsers to accomplish tasks or consume content, the application falls within scope. [^13] The definition is described as intentionally platform-independent and technology-agnostic, with emphasis on delivery mechanism and user interaction patterns rather than specific implementation technologies. [^14]

### API Classification

**Application programming interface (API)**-driven services require additional classification based on their primary access pattern. Pure machine-to-machine APIs serving only programmatic clients are considered out of scope under the report and are directed to use the base SCI methodology. [^15] However, APIs accessed primarily through browser-based interfaces—such as those with interactive documentation as the primary usage method, or those coupled with browser-based management dashboards—fall within scope when the browser interface represents the primary human interaction mode. [^16] The determining factor, as stated in the document, is whether human users consume the service's value through browser rendering, not whether HTTP protocols are involved. [^17]

---

## Target Personas

The SCI for Web specification is designed for technical practitioners who create and optimise browser-mediated web applications across both server-side infrastructure and client-side implementation. [^18] The document identifies three primary persona categories and acknowledges additional stakeholders who are not regarded as primary targets.

### Frontend Developers and Design Practitioners

Frontend developers and design practitioners control the code, assets, and experiences delivered to browsers, directly affecting energy consumed on end-user devices during browser-mediated interactions. [^19] The document identifies the following sub-groups within this category:

- **Frontend developers**, whose responsibilities include JavaScript bundle size and optimisation, **Cascading Style Sheets (CSS)** efficiency, framework selection for client-side execution, third-party script integration, rendering performance, asset optimisation (images, fonts, videos), progressive enhancement strategies, and client-side caching; [^20]
- **User experience (UX) and user interface (UI) designers**, whose interface design decisions affect resource consumption through choices such as infinite scroll versus pagination, video backgrounds versus static images, auto-playing media, and interaction patterns determining data transfer frequency; [^21] and
- **Content designers**, whose content strategy affects page weight, media selection and optimisation requirements, and structured content delivery. [^22]

The document notes that these practitioners do not control server-side infrastructure location, database architecture, hosting provider selection, network infrastructure between datacentre and user, or end-user device hardware specifications. [^23]

### Backend and Infrastructure Engineers

Backend and infrastructure engineers control server-side systems that generate and deliver content to browsers, affecting operational emissions from datacentres and infrastructure. [^24] Sub-groups identified in this category include:

- **Backend developers**, responsible for server-side code efficiency, API design and optimisation, database query performance, caching strategies, and session management; [^25]
- **Infrastructure and systems engineers**, responsible for cloud provider and geographic hosting location selection, server capacity planning and right-sizing, resource utilisation policies, infrastructure architecture, and build and deployment pipeline efficiency including **continuous integration and continuous deployment (CI/CD)** processes; [^26] and
- **Platform and DevOps engineers**, responsible for **content delivery network (CDN)** configuration and edge caching, architectural patterns affecting server and client computation distribution—such as server-side rendering, static site generation, and hybrid approaches—as well as monitoring and observability systems. [^27]

### Product Owners and Technical Managers

Product owners and technical managers translate organisational goals into technical requirements and manage trade-offs between features, performance, and sustainability. [^28] The document identifies two sub-groups:

- **Product owners and managers**, whose responsibilities include feature prioritisation and lifecycle management (described in the document as "gardening"—pruning unnecessary features), performance budget setting, sustainability target definition, and trade-off decisions between functionality and efficiency; [^29] and
- **Technical leads and architects**, who exercise architectural decision-making authority, technology selection across the software stack, team capacity allocation for optimisation work, and supplier and third-party service selection criteria including non-functional requirements such as performance and sustainability. [^30]

### Rationale for Persona Selection

The document states that because the agreed scope defines web applications as involving "browser-mediated human interaction" where "rendering and execution occur primarily within web browser environments," measurement must encompass both server-side energy—associated with generating responses—and client-side energy—associated with rendering content for human interaction. [^31] Frontend practitioners who control browser-delivered experiences are therefore considered equally essential to backend practitioners who control server infrastructure. Product roles are included because they provide the decision-making authority required to prioritise sustainability work and establish performance budgets that enable technical implementation. [^32]

### Third-Party Dependencies and Transparency

The document identifies the treatment of third-party dependencies as a critical inclusion within the SCI for Web boundary. Modern web applications depend extensively on third-party services for functionality including analytics, advertising, authentication, payments, CDNs, and hosting. [^33] These dependencies consume energy on both servers and client devices. According to the report, third-party services must be included within the SCI for Web boundary in order to incentivise measurement, monitoring, and improvement of their performance and energy efficiency, and to encourage suppliers to reduce their own carbon emissions. [^34]

Where precise energy data from third-party suppliers is unavailable, the document states that practitioners shall use industry default values with explicit disclosure that estimates were used, describing this approach as balancing comprehensiveness with implementation feasibility while creating market pressure for suppliers to provide transparency. [^35]

The document further identifies a supplier influence mechanism: while practitioners cannot directly control third-party implementations, they exercise influence through vendor selection, contractual requirements for emissions transparency, and the collective market signal that sustainability performance affects purchasing decisions. [^36]

### Acknowledged but Not Primary Targets

The document acknowledges three categories of stakeholders as relevant but not primary targets of the specification:

- **Suppliers and third-party service providers**: While their implementations significantly affect web application carbon footprint, they are described as users of the specification rather than its primary audience. The specification is stated to enable practitioners to pressure suppliers for transparency and improved performance through informed vendor selection. [^37]
- **Standards bodies and regulatory authorities**: These entities set broader context but are not the specification's implementation audience. The document states that the specification should align with existing standards, including the parent SCI methodology and accessibility guidelines, and should support regulatory compliance. [^38]
- **End users and consumers**: These individuals are described as having limited agency based on choices made by practitioners. [^39]

---

## Implementation Practices and Incentives

The Assembly Report identifies categories of encouraged and discouraged practices, along with design implications for the SCI for Web specification. This section of the document addresses the **accuracy–adoption trade-off**, trust and transparency requirements, threshold criteria for usefulness, gaming prevention principles, success indicators, implementation feasibility boundaries, the connection to behavioural incentives, and key principles, as well as conformance to the parent SCI specification. [^40] A comparative analysis of core evaluation criteria is also included as a final section of the source document. [^41]

---

## See Also

- [[Software Carbon Intensity]]
- [[Green Software Foundation]]
- [[Carbon intensity]]
- [[Web application]]
- [[Life-cycle assessment]]
- [[Scope 3 emissions]]

---

## References

[^1]: Green Software Foundation. *SCI for Web Assembly Report: Consensus Design Document for Measuring Web Application Carbon Intensity*.
[^2]: Ibid., Executive Summary.
[^3]: Ibid.
[^4]: Ibid., §4.9, "Conformance to Parent SCI Specification."
[^5]: Ibid.
[^6]: Ibid., Executive Summary.
[^7]: Ibid.
[^8]: Ibid.
[^9]: Ibid.
[^10]: Ibid., §1, "Scope Definition."
[^11]: Ibid.
[^12]: Ibid.
[^13]: Ibid.
[^14]: Ibid.
[^15]: Ibid.
[^16]: Ibid.
[^17]: Ibid.
[^18]: Ibid., §2, "Target Personas."
[^19]: Ibid., §2.1.
[^20]: Ibid.
[^21]: Ibid.
[^22]: Ibid.
[^23]: Ibid.
[^24]: Ibid., §2.2.
[^25]: Ibid.
[^26]: Ibid.
[^27]: Ibid.
[^28]: Ibid., §2.3.
[^29]: Ibid.
[^30]: Ibid.
[^31]: Ibid., §2.4.
[^32]: Ibid.
[^33]: Ibid., §2.5.
[^34]: Ibid.
[^35]: Ibid.
[^36]: Ibid.
[^37]: Ibid., §2.6.
[^38]: Ibid.
[^39]: Ibid.
[^40]: Ibid., §4, "Evaluation Criteria."
[^41]: Ibid., §5, "Comparative Analysis."