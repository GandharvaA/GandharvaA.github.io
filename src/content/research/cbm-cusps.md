---
title: Probing ΛΛ interactions via cusps with CBM at FAIR
kicker: PhD project II · CBM at FAIR · QCD at FAIR programme
summary: >-
  A simulation-driven feasibility study: can a sharp cusp in the ΛΛ mass spectrum reveal how two Λ
  hyperons interact, and can the future CBM experiment measure it?
order: 2
period: 2025 – present
illustration: cusp
figureCaption: >-
  <b>Fig. 3.</b> Schematic ΛΛ invariant-mass spectrum (illustrative shapes, not data). Where the
  heavier Ξ⁰n and Ξ⁻p channels open, coupled-channel effects create sharp cusps. Their shape encodes
  the ΛΛ scattering parameters, but finite detector resolution smears them out, which is exactly what a
  feasibility study must quantify.
tags: [CBM, FAIR, feasibility study, event generator, detector response, dispersion relations]
---

## In short

The HADES measurement establishes *how often* two Λ hyperons are produced. The next question is *how
they interact*. Two Λs can briefly turn into a heavier pair (a Ξ hyperon and a nucleon) and back. Right
at the energy where that heavier channel opens, the ΛΛ mass spectrum develops a sharp kink, a **cusp**.
The shape of the cusp carries information about the interaction, and reading it does not require
assumptions about the size of the particle source, which limit other methods.

The **CBM experiment** at the new FAIR accelerator will deliver far higher collision rates and a larger
acceptance than HADES. My work asks a practical engineering question before the hardware runs: **with
realistic detector resolution, efficiency and statistics, can CBM see these cusps and extract the
interaction parameters?**

## What I build

- **An event generator of my own** that produces pp → ΛΛK⁺K⁺ events with realistic physics: phase space,
  final-state interactions (an Omnès/Hanhart-type treatment) and next-to-leading-order amplitudes provided
  by theory collaborators, with accept–reject unweighting.
- **Detector-response folding**: the generated events are smeared with CBM resolution and efficiency and
  reconstructed with kinematic fitting, inside the CBM simulation framework (CbmRoot).
- **Parameter extraction**: a dispersion-relation-based fit that recovers the **scattering length** and
  **effective range** from the cusp region, with sensitivity studies versus statistics and resolution.
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
