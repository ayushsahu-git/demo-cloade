export interface SampleDoc {
  name: string;
  pages: number;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    name: "Quantum_Computing_Fundamentals.pdf",
    pages: 4,
    text: `Quantum Computing Fundamentals & Architecture

1. Concepts and Principles of Quantum Information
Quantum computing harnesses the laws of quantum mechanics to process information in fundamentally different ways than classical computers. Whereas classical computers use binary bits that exist strictly in a state of 0 or 1, quantum computers utilize quantum bits, or qubits. Qubits can exist in a superposition of states, simultaneously representing linear combinations of |0⟩ and |1⟩ described by the state vector |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex probability amplitudes such that |α|² + |β|² = 1.

Entanglement is a second foundational property of quantum mechanics wherein two or more qubits become interconnected such that the quantum state of each particle cannot be described independently of the others, regardless of spatial separation. When entangled qubits are measured, the measurement of one instantaneously determines the outcome of the other, enabling exponentially dense data correlations.

2. Quantum Hardware Platforms and Superconducting Circuits
Modern physical implementations of qubits rely on several competing physical architectures:
First, superconducting transmon circuits utilize Josephson junctions acting as non-linear inductors paired with capacitors to create artificial two-level atomic systems operated at temperatures below 15 millikelvin using dilution refrigerators.
Second, trapped-ion quantum computers use electromagnetic RF Paul traps to confine ionized ytterbium or calcium atoms in high vacuum, manipulating qubit states using finely focused ultraviolet or optical laser pulses. Trapped-ion systems boast exceptionally long coherence times and superior gate fidelities exceeding 99.9%, albeit with slower gate execution speeds than solid-state devices.
Third, photonic quantum computers manipulate single photons using beam splitters, phase shifters, and waveguides at room temperature, using measurement-based quantum computing protocols.

3. Quantum Algorithms and Computational Advantage
Quantum algorithms achieve superpolynomial speedups for specific classes of computational problems:
Shor's Algorithm, formulated by Peter Shor in 1994, solves integer factorization and discrete logarithms in polynomial time O((log N)³), in contrast to the best classical general number field sieve which operates in sub-exponential time. Shor's algorithm directly challenges widely used RSA public-key cryptosystems.
Grover's Algorithm, developed by Lov Grover in 1996, provides a quadratic speedup for unstructured database search and function inversion, evaluating search spaces in O(√N) oracle queries compared to classical O(N) exhaustive searches.
In chemistry and materials science, the Variational Quantum Eigensolver (VQE) and the Quantum Approximate Optimization Algorithm (QAOA) run on Noisy Intermediate-Scale Quantum (NISQ) devices, combining classical optimizers with parameterized quantum circuits to approximate molecular ground states and solve combinatorial optimization tasks.

4. Quantum Error Correction and Fault Tolerance
Physical qubits are acutely susceptible to environmental decoherence, caused by thermal fluctuations, stray electromagnetic radiation, and cosmic rays. Decoherence induces bit-flip (X) and phase-flip (Z) errors.
To overcome this vulnerability, Quantum Error Correction (QEC) schemes map one logical qubit across an ensemble of physical data and syndrome ancilla qubits. The leading architecture is the Surface Code, which arranges qubits on a 2D planar lattice. The surface code features a relatively high error threshold of approximately 1% and requires nearest-neighbor qubit connectivity. Realizing a fault-tolerant logical qubit with an error rate below 10⁻¹² requires hundreds to thousands of physical qubits per logical qubit.`,
  },
  {
    name: "Photosynthesis_and_Cellular_Energy.pdf",
    pages: 3,
    text: `Photosynthesis and Cellular Respiration: Principles of Bioenergetics

1. Introduction to Cellular Bioenergetics
Biological life requires a continuous input of free energy to sustain metabolic order, synthesize macromolecules, and maintain homeostatic chemical gradients across membranes. The primary currency of cellular energy transfer is Adenosine Triphosphate (ATP). Hydrolysis of ATP's phosphoanhydride bonds to form Adenosine Diphosphate (ADP) and inorganic phosphate (Pi) yields approximately -30.5 kJ/mol of standard free energy (ΔG°'), which is coupled to endergonic cellular reactions.

2. Photosynthesis: Light-Dependent Reactions
Photosynthesis takes place within the chloroplasts of photosynthetic autotrophs. The light-dependent reactions occur across the thylakoid membrane and convert radiant solar energy into chemical reducing power (NADPH) and ATP.
Photosystem II (PSII, P680) absorbs photons at 680 nm, exciting electrons that are replaced through photolysis—the water-splitting reaction catalyzed by the oxygen-evolving manganese cluster (2H₂O → 4H⁺ + 4e⁻ + O₂).
Electrons travel down an electron transport chain via plastoquinone (PQ), the cytochrome b6f complex, and plastocyanin (PC) to Photosystem I (PSI, P700). Cytochrome b6f pumps protons into the thylakoid lumen, generating a proton-motive force across the membrane.
At PSI, absorbed light re-energizes electrons transferred to ferredoxin, where Ferredoxin-NADP+ reductase (FNR) reduces NADP+ to NADPH. The accumulated proton gradient drives ATP synthase to produce ATP in the stroma via photophosphorylation.

3. The Calvin-Benson Cycle (Light-Independent Reactions)
The synthesis of hexose sugars occurs in the stroma through the Calvin cycle across three essential phases:
1. Carbon Fixation: The enzyme Ribulose-1,5-bisphosphate carboxylase-oxygenase (RuBisCO) catalyzes the fixation of carbon dioxide (CO₂) to a five-carbon sugar, ribulose 1,5-bisphosphate (RuBP), yielding an unstable six-carbon intermediate that immediately cleaves into two molecules of 3-phosphoglycerate (3-PGA).
2. Reduction: 3-PGA is phosphorylated by ATP to 1,3-bisphosphoglycerate and subsequently reduced by NADPH to form glyceraldehyde 3-phosphate (G3P). For every three turns of the cycle (fixing 3 CO₂ molecules), six G3P molecules are formed, one of which exits the cycle for carbohydrate synthesis.
3. Regeneration of RuBP: The remaining five molecules of G3P undergo complex rearrangement requiring ATP to regenerate three molecules of RuBP, enabling subsequent catalytic cycles.

4. Cellular Respiration and Mitochondrial ATP Synthesis
Aerobic respiration occurs in eukaryotic mitochondria, oxidizing glucose completely to CO₂ and H₂O.
Glycolysis in the cytosol breaks one glucose into two pyruvate molecules, yielding a net of 2 ATP and 2 NADH. Pyruvate enters the mitochondrial matrix, undergoing oxidative decarboxylation to form Acetyl-CoA.
The Citric Acid Cycle (Krebs cycle) fully oxidizes acetyl groups, producing 3 NADH, 1 FADH₂, and 1 GTP/ATP per acetyl-CoA.
Finally, Oxidative Phosphorylation utilizes electron transport complexes (I, II, III, IV) in the inner mitochondrial membrane to pump protons into the intermembrane space. The returning flux of protons through ATP Synthase (chemiosmosis) generates the bulk of ATP (~30-32 ATP per glucose molecule).`,
  },
];
