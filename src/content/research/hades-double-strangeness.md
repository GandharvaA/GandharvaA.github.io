---
title: Double-strangeness production with HADES
kicker: PhD project I · HADES at GSI, Darmstadt
summary: >-
  Measuring how often two Λ hyperons are produced together in proton–proton collisions, a rare
  process buried in a large background, with the HADES spectrometer and its new forward detector.
order: 1
period: 2021 – present
illustration: hades
figureCaption: >-
  <b>Fig. 2.</b> Schematic side view of HADES (not to scale). The proton beam hits a liquid-hydrogen
  target; drift chambers before and after a toroidal magnet measure momenta, timing walls measure
  flight times, and the forward detector built from PANDA straw tubes catches protons at small angles.
  Each Λ flies a few centimetres before decaying into a proton and a π⁻.
tags: [HADES, hyperons, detector operation, likelihood fits, Monte Carlo, ML classification, HPC]
---

## In short

When two protons collide at high energy they can occasionally produce two **Λ hyperons**, heavier
cousins of the proton that contain a *strange* quark. How often this happens, and how two Λs push or
pull on each other, is poorly known. It matters because the same particles are expected to appear deep
inside **neutron stars**, where they change how stiff (and therefore how heavy) a star can be.

My job is to find these events in the data. Only a tiny fraction of collisions produce two Λs, and each
Λ is invisible. It is only seen through the proton and pion it decays into. The task is therefore a
classic **signal-from-noise problem**: reconstruct millions of collisions, model the detector precisely,
and separate a faint signal from a large background with a fully quantified uncertainty.

## The experiment

[HADES](https://hades.gsi.de/) is a large spectrometer at the GSI/FAIR
accelerator centre in Darmstadt, Germany. In **February 2022** it recorded proton–proton collisions with
a 4.5 GeV proton beam on a liquid-hydrogen target (centre-of-mass energy √s = 3.46 GeV, only 240 MeV above
the threshold for producing two Λs and two K⁺ mesons): a dataset of about 155 TB.

For this campaign HADES was upgraded with new instruments that are central to the analysis:

- a **forward detector** built from straw-tube tracking stations of the future PANDA experiment and a
  resistive-plate chamber, covering very small angles where most protons from Λ decays end up;
- an **LGAD start detector** (low-gain avalanche diodes) giving the collision time (T0);
- an **inner time-of-flight** detector.

I took part in the five-week beam time, taking shifts and helping with drift-chamber online quality
assurance. Seeing where the data come from has shaped every later analysis decision.

## My role

Within the HADES collaboration I hold the **main analysis responsibility for the ΛΛ channel**
(pp → ΛΛK⁺K⁺, with each Λ → pπ⁻). That covers the full chain from raw reconstructed tracks to a physics
result:

- **Particle identification.** Start-detector timing issues made standard time-of-flight identification
  unreliable. I developed a **relative time-of-flight** method that uses a reference pion in the same
  event to cancel the unknown start time, a distinctive approach within the collaboration.
- **Reconstruction and selection.** Vertex reconstruction, distance-of-closest-approach and decay-length
  criteria, missing-mass selections, a π⁺ veto and **kinematic fitting** (vertex and multi-constraint fits
  with the KinFit package, which I regularly test and report issues for).
- **Signal extraction.** Two-dimensional invariant-mass spectra of both Λ candidates, analysed with a
  statistical sideband method, least-squares fits and, in the current analysis, a **2D
  maximum-likelihood template fit** with simulated signal and background components.
- **Machine learning.** Multiclass classifiers (ROOT **TMVA**) trained on simulation to separate ΛΛ signal
  from the different background classes.
- **Systematics and automation.** A staged analysis pipeline (stages S0–S3) that runs every selection and
  identification variation on the GSI batch farm, so that systematic uncertainties come out of one
  reproducible workflow. I built and automate it with the help of **AI coding assistants** (Cursor and
  large language models), which lets me iterate far faster on analysis code while I stay responsible for
  the physics choices.
- **Collaboration.** I hosted and minuted the weekly meetings of the HADES Λ-Reconstruction Task Force and
  the kinematic-fitting working group (2022–23), and present progress regularly at collaboration meetings.

The licentiate thesis (March 2024) established the analysis strategy and a first production estimate;
the ongoing work refines the signal extraction and systematic uncertainties towards a collaboration
publication. Preliminary numbers are internal to the collaboration until approved, so they are not shown
here.

## Methods in more depth

**Simulation.** Acceptance and efficiency come from Monte Carlo: events generated with **PLUTO**
(phase-space and resonance models), passed through a GEANT3-based detector simulation (**HGeant**) and the
same **HYDRA** reconstruction (C++/ROOT) as the real data. Background "cocktails" model the single-Λ and
multi-pion channels that can mimic the signal.

**Statistics.** The signal sits on a correlated two-dimensional background, so the fit models both Λ
candidates jointly. Results from inclusive, semi-exclusive and exclusive selections are combined with a
correlation-aware weighted average, and systematic variations of every cut and identification choice are
propagated through the full chain.

**Computing.** Analysis runs as batch jobs (Slurm) on GSI's **Virgo** cluster with containerised software
(Singularity/Apptainer, CVMFS) and Lustre storage; downstream fits run in Python (uproot, NumPy, SciPy,
iminuit) and ROOT. Everything is versioned in Git.

As stated in the [HYP2025 proceedings](/publications/): *"The results may provide constraints on
hyperon–hyperon interactions and serve as an essential baseline for future studies at FAIR."*
