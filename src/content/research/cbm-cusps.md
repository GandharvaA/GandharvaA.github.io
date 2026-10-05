---
title: The ΛΛ spectrum and ΞN cusps with CBM at FAIR
kicker: PhD project II · CBM at FAIR · QCD at FAIR programme
summary: >-
  A simulation-driven feasibility study for CBM. The ΛΛ interaction comes from a fit of the mass
  spectrum up to the first ΞN threshold. The cusps there constrain the cascade–nucleon interaction,
  and the question is whether CBM can resolve both.
order: 2
period: 2025 – present
illustration: cusp
figureCaption: >-
  <b>Fig. 3.</b> Schematic ΛΛ invariant-mass spectrum (illustrative shapes, not data). A fit up to the
  first ΞN threshold constrains the ΛΛ interaction. Where the heavier Ξ⁰n and Ξ⁻p channels open,
  coupled-channel effects create sharp cusps, and those cusps constrain the cascade–nucleon
  interaction. Finite detector resolution smears them out, which is what a feasibility study must quantify.
tags: [CBM, FAIR, feasibility study, event generator, detector response, dispersion relations]
---

## In short

The HADES measurement determines the near-threshold production of two Λ hyperons. The next question is
how they interact. A fit of the ΛΛ mass spectrum up to the first ΞN threshold constrains the ΛΛ
interaction. Above that threshold the two Λs can convert into a cascade and a nucleon (ΞN) and back.
Where the ΞN channel opens, the spectrum develops a sharp kink, a **cusp**, and that cusp constrains
the cascade–nucleon interaction rather than the ΛΛ interaction itself. Reading the spectrum this way
does not require assumptions about the size of the particle source, which limit other methods.

The **CBM experiment** at the new FAIR accelerator will deliver far higher collision rates and a larger
acceptance than HADES. My work asks a practical question before the hardware runs: **with realistic
detector resolution, efficiency and statistics, can CBM extract the ΛΛ interaction below the first
threshold and resolve the ΞN cusps?**

## What I build

- **An event generator of my own** that produces pp → ΛΛK⁺K⁺ events with realistic physics: phase space,
  final-state interactions (an Omnès/Hanhart-type treatment) and next-to-leading-order amplitudes provided
  by theory collaborators, with accept–reject unweighting.
- **Detector-response folding**: the generated events are smeared with CBM resolution and efficiency and
  reconstructed with kinematic fitting, inside the CBM simulation framework (CbmRoot).
- **Parameter extraction**: a dispersion-relation-based fit of the spectrum up to the first ΞN
  threshold, recovering the ΛΛ **scattering length** and **effective range**, with sensitivity studies
  versus statistics and resolution. The cusps themselves are the constraint on the cascade–nucleon
  interaction.
- Related studies of Σ⁺Σ⁺ systems with the same approach.

The scenario studied is a 5 GeV proton beam at CBM/SIS100 with high interaction rates, conditions that
make rare channels like this one accessible for the first time.

## Collaboration and output

The study is done with the GSI hyperon group and theorists at **Forschungszentrum Jülich**, within the
**QCD at FAIR** programme. It is featured in the community white paper
[*Hadron Physics Opportunities at FAIR*](https://arxiv.org/abs/2512.15986) (arXiv:2512.15986), of which I
am a co-author, and I have presented it at HYP2025 (Tokyo), an invited talk at the DPG Spring Meeting 2026 (Erlangen), the
Nordic Meeting on Nuclear Physics 2026 (Visby) and NSTAR 2026 (Seville).

The final part of the thesis will connect the extracted parameters to the **equation of state of
neutron-star matter**, closing the loop from accelerator data to astrophysics.
