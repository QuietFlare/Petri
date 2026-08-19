/**
 * nf-core pipeline catalogue — 142 active pipelines in 14 domains.
 *
 * Generated from https://nf-co.re/pipelines.json (archived pipelines excluded).
 * Categories are curated, not from nf-core metadata: their `topics` field is too
 * sparse to group by. Regenerate with scripts/gen_catalog.py when nf-core adds
 * pipelines — this is a static snapshot so the page works offline.
 *
 * `focus: true` marks pipelines on the AMR path (bacass -> funcscan) that this
 * project is built around.
 */

export const CATALOG = [
  {
    "title": "Pathogens, Bacteria & AMR",
    "blurb": "Bacterial isolates, outbreak tracking and resistance screening.",
    "pipelines": [
      {
        "name": "bacass",
        "description": "Simple bacterial assembly and annotation pipeline",
        "version": "2.6.1",
        "focus": true
      },
      {
        "name": "funcscan",
        "description": "(Meta-)genome screening for functional and natural product gene sequences",
        "version": "4.0.0",
        "focus": true
      },
      {
        "name": "bactmap",
        "description": "A mapping-based pipeline for creating a phylogeny from bacterial whole genome sequences",
        "version": "1.0.0",
        "focus": true
      },
      {
        "name": "bacmodel",
        "description": "Systems-based bacterial functional modeling pipeline",
        "version": "",
        "focus": false
      },
      {
        "name": "pathogensurveillance",
        "description": "Surveillance of pathogens using population genomics and sequencing",
        "version": "1.1.0",
        "focus": true
      },
      {
        "name": "pathogenepidemiology",
        "description": "[UNDER DEVELOPMENT] A profile-based pipeline for genomic epidemiological analysis of predefined pathogens.",
        "version": "",
        "focus": false
      },
      {
        "name": "tbanalyzer",
        "description": "An nf-core (meta) pipeline for analysis of different members of Mycobacterium tuberculosis complex.",
        "version": "",
        "focus": true
      },
      {
        "name": "hgtseq",
        "description": "A pipeline to investigate horizontal gene transfer from NGS data",
        "version": "1.1.0",
        "focus": true
      },
      {
        "name": "phageannotator",
        "description": "Pipeline for identifying, annotation, and quantifying phage sequences in (meta)-genomic sequences.",
        "version": "",
        "focus": false
      },
      {
        "name": "detaxizer",
        "description": "A pipeline to identify (and remove) certain sequences from raw genomic data. Default taxon to identify (and remove) is Homo sapiens. Removal is optional.",
        "version": "1.3.0",
        "focus": false
      },
      {
        "name": "createtaxdb",
        "description": "Parallelised and automated construction of metagenomic classifier databases of different tools",
        "version": "3.1.0",
        "focus": false
      },
      {
        "name": "viralrecon",
        "description": "Assembly and intrahost/low-frequency variant calling for viral samples",
        "version": "3.0.0",
        "focus": false
      },
      {
        "name": "viralmetagenome",
        "description": "A nf-core pipeline for untargeted whole genome reconstruction with iSNV detection from metagenomic samples.",
        "version": "1.1.3",
        "focus": false
      },
      {
        "name": "viralintegration",
        "description": "Analysis pipeline for the identification of viral integration events in genomes using a chimeric read approach.",
        "version": "0.1.1",
        "focus": false
      }
    ]
  },
  {
    "title": "Metagenomics, Microbiome & Ancient DNA",
    "blurb": "Mixed samples: who is present, and what can they do.",
    "pipelines": [
      {
        "name": "mag",
        "description": "Assembly and binning of metagenomes",
        "version": "5.4.2",
        "focus": false
      },
      {
        "name": "taxprofiler",
        "description": "Highly parallelised multi-taxonomic profiling of shotgun short- and long-read metagenomic data",
        "version": "2.0.1",
        "focus": false
      },
      {
        "name": "funcprofiler",
        "description": "Read-based functional profiling of microbiome sequencing data",
        "version": "",
        "focus": false
      },
      {
        "name": "metatdenovo",
        "description": "Assembly and annotation of metatranscriptomic or metagenomic data for prokaryotic, eukaryotic and viruses.",
        "version": "1.4.0",
        "focus": false
      },
      {
        "name": "magmap",
        "description": "Best-practice analysis pipeline for mapping reads to a (large) collections of genomes",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "ampliseq",
        "description": "Amplicon sequencing analysis workflow using DADA2 and QIIME2",
        "version": "2.18.0",
        "focus": false
      },
      {
        "name": "daamicrobiome",
        "description": "Microbiome differential abundance consensus pipeline",
        "version": "",
        "focus": false
      },
      {
        "name": "metapep",
        "description": "From metagenomes to epitopes and beyond",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "kmermaid",
        "description": "k-mer similarity analysis pipeline",
        "version": "0.1.0-alpha",
        "focus": false
      },
      {
        "name": "eager",
        "description": "A fully reproducible and state-of-the-art ancient DNA analysis pipeline",
        "version": "2.5.3",
        "focus": false
      },
      {
        "name": "coproid",
        "description": "Coprolite host Identification pipeline",
        "version": "2.0.1",
        "focus": false
      }
    ]
  },
  {
    "title": "Genome Assembly & Annotation",
    "blurb": "Building and describing reference sequences.",
    "pipelines": [
      {
        "name": "genomeassembler",
        "description": "Assembly and scaffolding of haploid / unphased genomes from long ONT or PacBio HiFi reads",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "genomeannotator",
        "description": "Pipeline for the identification of (coding) gene structures in draft genomes.",
        "version": "",
        "focus": false
      },
      {
        "name": "genomeqc",
        "description": "Compare the quality of multiple genomes, along with their annotations.",
        "version": "",
        "focus": false
      },
      {
        "name": "genomeskim",
        "description": "QC and filtering of genome skims, followed by organelle assembly and/or genome analysis",
        "version": "",
        "focus": false
      },
      {
        "name": "pangenome",
        "description": "Renders a collection of sequences into a pangenome graph. https://doi.org/10.1093/bioinformatics/btae609.",
        "version": "1.1.3",
        "focus": false
      },
      {
        "name": "ncrnannotator",
        "description": "nf-core pipeline for genome-level ncRNA annotation using Infernal",
        "version": "",
        "focus": false
      },
      {
        "name": "pairgenomealign",
        "description": "Pairwise genome comparison pipeline using the LAST software to align a list of query genomes to a target genome, and plot the results",
        "version": "3.0.3",
        "focus": false
      },
      {
        "name": "references",
        "description": "nf-core/references is a bioinformatics pipeline that build references, for multiple use cases",
        "version": "0.1",
        "focus": false
      }
    ]
  },
  {
    "title": "Human Variants & Rare Disease",
    "blurb": "Reference-based variant calling and clinical interpretation.",
    "pipelines": [
      {
        "name": "sarek",
        "description": "Analysis pipeline to detect germline or somatic variants (pre-processing, variant calling and annotation) from WGS / targeted sequencing",
        "version": "3.9.0",
        "focus": false
      },
      {
        "name": "raredisease",
        "description": "Call and score variants from WGS/WES of rare disease patients.",
        "version": "3.1.2",
        "focus": false
      },
      {
        "name": "longraredisease",
        "description": "Long read sequencing pipeline to identify variants in patients with neurodevelopmental disorders",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "rarevariantburden",
        "description": "Pipeline for performing consistent summary count based rare variant burden test, which is useful when we only have sequenced cases data. For example, we can compare the cases against public summary count data, such as gnomAD.",
        "version": "",
        "focus": false
      },
      {
        "name": "gwas",
        "description": "UNDER CONSTRUCTION: A pipeline for Genome Wide Association Studies",
        "version": "",
        "focus": false
      },
      {
        "name": "phaseimpute",
        "description": "A bioinformatics pipeline to phase and impute genetic data",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "variantcatalogue",
        "description": "Pipeline to generate variant catalogues, a list of variants and their frequencies in a population, from whole genome sequences.",
        "version": "",
        "focus": false
      },
      {
        "name": "variantbenchmarking",
        "description": "Pipeline to evaluate and validate the accuracy of variant calling methods in genomic research",
        "version": "1.5.0",
        "focus": false
      },
      {
        "name": "variantprioritization",
        "description": "Bioinformatics analysis pipeline for the functional annotation and translation of somatic SNVs/InDels and copy number abberations for precision cancer medicine using Personal Cancer Genome Reporter (PCGR). The pipeline offers germline SNVs/INDELS intepretation and annotation using Cancer Predisposition Sequencing Reporter (CPSR).",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "genomicrelatedness",
        "description": "Bioinformatics pipeline for estimating genetic relatedness from low-coverage whole-genome sequencing (sWGS) data",
        "version": "",
        "focus": false
      },
      {
        "name": "createpanelrefs",
        "description": "Generate Panel of Normals, models or other similar references from lots of samples",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "radseq",
        "description": "Variant-calling pipeline for Restriction site-associated DNA sequencing (RADseq).",
        "version": "",
        "focus": false
      },
      {
        "name": "mitodetect",
        "description": "A-Z analysis of mitochondrial NGS data",
        "version": "",
        "focus": false
      },
      {
        "name": "drop",
        "description": "Pipeline to find aberrant events in RNA-Seq data, useful for diagnosis of rare disorders",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "hlatyping",
        "description": "Precision HLA typing from next-generation sequencing data",
        "version": "2.2.0",
        "focus": false
      },
      {
        "name": "abotyper",
        "description": "A pipeline for characterising the Human Blood Group and Red Cell Antigens using Oxford Nanopore third-generation sequencing data.",
        "version": "",
        "focus": false
      },
      {
        "name": "deepmutscan",
        "description": "nf-core/deepmutscan is a reproducible, scalable, and community-curated pipeline for analyzing deep mutational scanning (DMS) data using shotgun DNA sequencing.",
        "version": "",
        "focus": false
      },
      {
        "name": "omicsgenetraitassociation",
        "description": "A nextflow pipeline which integrates multiple omic data streams and performs coordinated analysis",
        "version": "",
        "focus": false
      },
      {
        "name": "diseasemodulediscovery",
        "description": "A pipeline for network-based disease module identification.",
        "version": "",
        "focus": false
      },
      {
        "name": "crisprseq",
        "description": "A pipeline for the analysis of CRISPR edited data. It allows the evaluation of the quality of gene editing experiments using targeted next generation sequencing (NGS) data (`targeted`) as well as the discovery of important genes from knock-out or activation CRISPR-Cas9 screens using CRISPR pooled DNA (`screening`).",
        "version": "2.3.0",
        "focus": false
      },
      {
        "name": "pacvar",
        "description": "Longread PacBio sequencing processing for WGS and PureTarget",
        "version": "1.1.0",
        "focus": false
      }
    ]
  },
  {
    "title": "Cancer Genomics",
    "blurb": "Somatic variation, tumour evolution and drug response.",
    "pipelines": [
      {
        "name": "oncoanalyser",
        "description": "A comprehensive cancer DNA/RNA analysis and reporting pipeline",
        "version": "2.3.0",
        "focus": false
      },
      {
        "name": "tumourevo",
        "description": "Analysis pipeline to model tumour clonal evolution from WGS data (driver annotation, quality control of copy number calls, subclonal and mutational signature deconvolution)",
        "version": "",
        "focus": false
      },
      {
        "name": "pacsomatic",
        "description": "Nextflow pipeline for PacBio HiFi tumor/normal somatic genomics",
        "version": "",
        "focus": false
      },
      {
        "name": "rnadnavar",
        "description": "Pipeline for RNA and DNA integrated analysis for somatic mutation detection",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "circdna",
        "description": "Pipeline for the identification of extrachromosomal circular DNA (ecDNA) from Circle-seq, WGS, and ATAC-seq data that were generated from cancer and other eukaryotic cells.",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "drugresponseeval",
        "description": "Pipeline for testing drug response prediction models in a statistically and biologically sound way.",
        "version": "1.2.2",
        "focus": false
      }
    ]
  },
  {
    "title": "RNA & Transcriptomics",
    "blurb": "Gene expression, splicing, fusions and non-coding RNA.",
    "pipelines": [
      {
        "name": "rnaseq",
        "description": "RNA sequencing analysis pipeline using STAR, RSEM, HISAT2 or Salmon with gene/isoform counts and extensive quality control.",
        "version": "3.26.0",
        "focus": false
      },
      {
        "name": "rnasplice",
        "description": "rnasplice is a bioinformatics pipeline for RNA-seq alternative splicing analysis",
        "version": "1.0.4",
        "focus": false
      },
      {
        "name": "rnafusion",
        "description": "RNA-seq analysis pipeline for detection of gene-fusions",
        "version": "4.1.3",
        "focus": false
      },
      {
        "name": "rnavar",
        "description": "gatk4 RNA variant calling pipeline",
        "version": "1.3.0",
        "focus": false
      },
      {
        "name": "smrnaseq",
        "description": "A small-RNA sequencing analysis pipeline",
        "version": "2.4.1",
        "focus": false
      },
      {
        "name": "riboseq",
        "description": "Pipeline for the analysis of ribosome profiling, or Ribo-seq (also named ribosome footprinting) data.",
        "version": "1.2.0",
        "focus": false
      },
      {
        "name": "circrna",
        "description": "circRNA quantification, differential expression analysis and miRNA target prediction of RNA-Seq data",
        "version": "",
        "focus": false
      },
      {
        "name": "dualrnaseq",
        "description": "Analysis of Dual RNA-seq data - an experimental method for interrogating host-pathogen interactions through simultaneous RNA-seq.",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "denovotranscript",
        "description": "A pipeline for de novo transcriptome assembly of paired-end short reads from bulk RNA-seq",
        "version": "1.2.1",
        "focus": false
      },
      {
        "name": "nascent",
        "description": "Nascent Transcription Processing Pipeline",
        "version": "2.3.0",
        "focus": false
      },
      {
        "name": "slamseq",
        "description": "SLAMSeq processing and analysis pipeline",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "cageseq",
        "description": "CAGE-sequencing analysis pipeline with trimming, alignment and counting of CAGE tags.",
        "version": "1.0.2",
        "focus": false
      },
      {
        "name": "clipseq",
        "description": "CLIP sequencing analysis pipeline for QC, pre-mapping, genome mapping, UMI deduplication, and multiple peak-calling options.",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "lncpipe",
        "description": "UNDER DEVELOPMENT--- Analysis of long non-coding RNAs from RNA-seq datasets",
        "version": "",
        "focus": false
      },
      {
        "name": "isoseq",
        "description": "Genome annotation with PacBio Iso-Seq. Takes raw subreads as input, generate Full Length Non Chemiric (FLNC) sequences and produce a bed annotation.",
        "version": "2.0.0",
        "focus": false
      },
      {
        "name": "rnastructurome",
        "description": "a bioinformatics pipeline for analysing chemical high-throughput RNA structure-probing data",
        "version": "",
        "focus": false
      },
      {
        "name": "alleleexpression",
        "description": "Alleleexpression is a nf-core pipeline for allele-specific expression (ASE) analysis using STAR-WASP for alignment, UMI-tools for deduplication, and phaser for haplotype phasing and ASE detection.",
        "version": "",
        "focus": false
      },
      {
        "name": "stableexpression",
        "description": "This pipeline is dedicated to identifying the most stable genes within a single or multiple expression dataset(s). This is particularly useful for identifying the most suitable RT-qPCR reference genes for a specific species.",
        "version": "",
        "focus": false
      },
      {
        "name": "dartseq",
        "description": "Pipeline for m6A detection in RNAseq data",
        "version": "",
        "focus": false
      },
      {
        "name": "evexplorer",
        "description": "nf-core/evexplorer is a pipeline for analyzing RNA data from extracellular vesicles, compatible with technologies such as nextflex, comboSeq, and ONT with further support forthcoming. evexplorer handles QC, expressed region detection, library size normalization and Differential RNA Expression (DRE)",
        "version": "",
        "focus": false
      },
      {
        "name": "differentialabundance",
        "description": "Differential abundance analysis for feature/ observation matrices from platforms such as RNA-seq",
        "version": "2.0.0",
        "focus": false
      },
      {
        "name": "nanostring",
        "description": "An analysis pipeline for Nanostring nCounter expression data.",
        "version": "1.3.3",
        "focus": false
      }
    ]
  },
  {
    "title": "Single-cell",
    "blurb": "Per-cell resolution rather than bulk averages.",
    "pipelines": [
      {
        "name": "scrnaseq",
        "description": "Single-cell RNA-Seq pipeline for barcode-based protocols such as 10x, DropSeq or SmartSeq, offering a variety of aligners and empty-droplet detection",
        "version": "4.2.0",
        "focus": false
      },
      {
        "name": "scnanoseq",
        "description": "Single-cell/nuclei pipeline for data derived from Oxford Nanopore and 10X Genomics",
        "version": "1.3.0",
        "focus": false
      },
      {
        "name": "scdownstream",
        "description": "A single cell transcriptomics pipeline for QC, integration and making the data presentable",
        "version": "",
        "focus": false
      },
      {
        "name": "marsseq",
        "description": "MARS-seq v2 pre-processing pipeline with velocity",
        "version": "1.0.3",
        "focus": false
      },
      {
        "name": "hadge",
        "description": "Comprehensive pipeline for donor demultiplexing in single cell",
        "version": "0.2.0",
        "focus": false
      },
      {
        "name": "pixelator",
        "description": "Pipeline to generate Proximity Network Assay data with Pixelator (Pixelgen Technologies AB)",
        "version": "5.0.0",
        "focus": false
      }
    ]
  },
  {
    "title": "Epigenetics & Chromatin",
    "blurb": "Methylation, accessibility and 3D genome structure.",
    "pipelines": [
      {
        "name": "methylseq",
        "description": "Methylation (Bisulfite-Sequencing) analysis pipeline using Bismark/bwa-meth + MethylDackel or bwa-mem + rastair",
        "version": "4.2.0",
        "focus": false
      },
      {
        "name": "methylong",
        "description": "Extract methylation calls from long reads (ONT/ PacBio)",
        "version": "2.0.0",
        "focus": false
      },
      {
        "name": "methylarray",
        "description": "Process methylation data from Illumina arrays. Pre-processing, quality checks, confounder check and DMPs (differentially methylated positions) and DMRs (differentially methylated regions). Optionally estimates cell type composition and adjusts data for it.",
        "version": "",
        "focus": false
      },
      {
        "name": "atacseq",
        "description": "ATAC-seq peak-calling and QC analysis pipeline",
        "version": "2.1.2",
        "focus": false
      },
      {
        "name": "chipseq",
        "description": "ChIP-seq peak-calling, QC and differential analysis pipeline.",
        "version": "2.1.0",
        "focus": false
      },
      {
        "name": "cutandrun",
        "description": "Analysis pipeline for CUT&RUN and CUT&TAG experiments that includes QC, support for spike-ins, IgG controls, peak calling and downstream analysis.",
        "version": "3.2.2",
        "focus": false
      },
      {
        "name": "mnaseseq",
        "description": "MNase-seq analysis pipeline using BWA and DANPOS2.",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "hic",
        "description": "Analysis of Chromosome Conformation Capture data (Hi-C)",
        "version": "2.1.0",
        "focus": false
      },
      {
        "name": "hicar",
        "description": "Pipeline for HiCAR data, a robust and sensitive multi-omic co-assay for simultaneous measurement of transcriptome, chromatin accessibility and cis-regulatory chromatin contacts.",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "sammyseq",
        "description": "Pipeline for Sequential Analysis of MacroMolecules accessibilitY sequencing (SAMMY-seq) data, to analyze chromatin state.",
        "version": "",
        "focus": false
      },
      {
        "name": "epigenomesegmentation",
        "description": "An nf-core pipeline for epigenome segmentation using EpiSegMix/Meth \u2014 a hidden Markov model with flexible read count distributions and state duration modeling for histone, open chromatin, and methylation signals.",
        "version": "",
        "focus": false
      },
      {
        "name": "tfactivity",
        "description": "Bioinformatics pipeline that makes use of expression and open chromatin data to identify differentially active transcription factors across conditions.",
        "version": "",
        "focus": false
      },
      {
        "name": "callingcards",
        "description": "A pipeline for processing calling cards data",
        "version": "1.0.0",
        "focus": false
      }
    ]
  },
  {
    "title": "Proteomics & Mass Spectrometry",
    "blurb": "Peptides and metabolites measured by MS, not sequencing.",
    "pipelines": [
      {
        "name": "mhcquant",
        "description": "Identify and quantify MHC eluted peptides from mass spectrometry raw data",
        "version": "3.2.0",
        "focus": false
      },
      {
        "name": "diaproteomics",
        "description": "Automated quantitative analysis of DIA proteomics mass spectrometry measurements.",
        "version": "1.2.4",
        "focus": false
      },
      {
        "name": "mspepid",
        "description": "This pipeline performs the peptide identification of MS2 spectra from a proteomics experiment. For this, different search algorithm and rescoring approaches can be selected.",
        "version": "",
        "focus": false
      },
      {
        "name": "metaboigniter",
        "description": "Pre-processing of mass spectrometry-based metabolomics data with quantification and identification based on MS1 and MS2 data.",
        "version": "2.0.1",
        "focus": false
      },
      {
        "name": "proteogenomicsdb",
        "description": "The ProteoGenomics database generation workflow creates different protein databases for ProteoGenomics data analysis.",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "ribomsqc",
        "description": "QC pipeline that monitors mass spectrometer performance in ribonucleoside analysis",
        "version": "1.0.0",
        "focus": false
      }
    ]
  },
  {
    "title": "Protein Structure & Families",
    "blurb": "Sequence to structure, orthology and evolution.",
    "pipelines": [
      {
        "name": "proteinfold",
        "description": "Protein 3D structure prediction pipeline",
        "version": "2.0.0",
        "focus": false
      },
      {
        "name": "proteinfamilies",
        "description": "Generation and updating of protein families",
        "version": "2.4.0",
        "focus": false
      },
      {
        "name": "proteinannotator",
        "description": "Generation of sequence-level annotations for amino acid sequences",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "multiplesequencealign",
        "description": "A pipeline to run and systematically evaluate Multiple Sequence Alignment (MSA) methods.",
        "version": "1.1.1",
        "focus": false
      },
      {
        "name": "reportho",
        "description": "nf-core pipeline for comparative analysis of ortholog predictions",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "genephylomodeler",
        "description": "A bioinformatics pipeline that fits evolutionary models and detects natural selection from multiple sequence alignments",
        "version": "",
        "focus": false
      },
      {
        "name": "phyloplace",
        "description": "nf-core/phyloplace is a bioinformatics best-practice analysis pipeline that performs phylogenetic placement with EPA-NG.",
        "version": "2.0.1",
        "focus": false
      }
    ]
  },
  {
    "title": "Immunology & Antigens",
    "blurb": "Immune receptors and antigen prediction.",
    "pipelines": [
      {
        "name": "airrflow",
        "description": "B-cell and T-cell Adaptive Immune Receptor Repertoire (AIRR) sequencing analysis pipeline using the Immcantation framework",
        "version": "5.1.0",
        "focus": false
      },
      {
        "name": "epitopeprediction",
        "description": "A bioinformatics best-practice analysis pipeline for epitope prediction and annotation",
        "version": "3.1.0",
        "focus": false
      }
    ]
  },
  {
    "title": "Imaging & Spatial Omics",
    "blurb": "Microscopy and tissue-resolved measurement.",
    "pipelines": [
      {
        "name": "mcmicro",
        "description": "An end-to-end processing pipeline that transforms multi-channel whole-slide images into single-cell data.",
        "version": "2.0.0",
        "focus": false
      },
      {
        "name": "imcyto",
        "description": "Image Mass Cytometry analysis pipeline",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "molkart",
        "description": "A pipeline for processing Molecular Cartography data from Resolve Bioscience (combinatorial FISH)",
        "version": "1.2.0",
        "focus": false
      },
      {
        "name": "spatialvi",
        "description": "Pipeline for processing spatially-resolved gene counts with spatial coordinates and image data. Designed for 10x Genomics Visium transcriptomics.",
        "version": "",
        "focus": false
      },
      {
        "name": "spatialaxe",
        "description": "A bioinformatics best-practice processing and quality control pipeline for Xenium and Artera data",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "sopa",
        "description": "Nextflow version of Sopa - spatial omics pipeline and analysis",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "lsmquant",
        "description": "A pipeline for processing and analysis of light-sheet microscopy images.",
        "version": "1.0.2",
        "focus": false
      },
      {
        "name": "panoramaseq",
        "description": "a pipeline to process sequencing based spatial transccriptomics data from in-situ arrays",
        "version": "",
        "focus": false
      },
      {
        "name": "cellpainting",
        "description": "",
        "version": "",
        "focus": false
      }
    ]
  },
  {
    "title": "Utility & Infrastructure",
    "blurb": "Plumbing: fetching, converting, QC, submission, provenance.",
    "pipelines": [
      {
        "name": "fetchngs",
        "description": "Pipeline to fetch metadata and raw FastQ files from public databases",
        "version": "1.12.0",
        "focus": true
      },
      {
        "name": "demultiplex",
        "description": "Demultiplexing pipeline for sequencing data",
        "version": "1.7.1",
        "focus": false
      },
      {
        "name": "nanoseq",
        "description": "Nanopore demultiplexing, QC and alignment pipeline",
        "version": "3.1.0",
        "focus": false
      },
      {
        "name": "bamtofastq",
        "description": "Converts bam or cram files to fastq format and does quality control.",
        "version": "2.2.1",
        "focus": false
      },
      {
        "name": "fastqrepair",
        "description": "A pipeline that can be used to recover corrupted FASTQ.gz files, drop or fix uncompliant reads, remove unpaired reads, and settles reads that became disordered",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "seqinspector",
        "description": "Dedicated QC-only pipeline for sequencing data. The pipeline will run a (potentially large) set of QC tools and can output global and group specific Multiqc reports. The pipeline is targeting core facilities or research groups with larger sequencing throughput.",
        "version": "1.1.0",
        "focus": false
      },
      {
        "name": "seqsubmit",
        "description": "nf-core pipeline for data submission to ENA",
        "version": "",
        "focus": false
      },
      {
        "name": "readsimulator",
        "description": "A pipeline to simulate sequencing reads, such as Amplicon, Target Capture, Metagenome, and Whole genome data.",
        "version": "1.0.1",
        "focus": false
      },
      {
        "name": "datasync",
        "description": "nf-core/datasync is a system operation pipeline that provides several workflows for handling system operation / automation tasks",
        "version": "",
        "focus": false
      },
      {
        "name": "provenancereport",
        "description": "A simple provenance reporting pipeline",
        "version": "",
        "focus": false
      },
      {
        "name": "demo",
        "description": "nf-core/demo is a simple nf-core style bioinformatics pipeline for workshops and demos.",
        "version": "1.2.0",
        "focus": false
      },
      {
        "name": "fastquorum",
        "description": "Pipeline to produce consensus reads using unique molecular indexes/barcodes (UMIs)",
        "version": "2.0.0",
        "focus": false
      },
      {
        "name": "deepmodeloptim",
        "description": "Stochastic Testing and Input Manipulation for Unbiased Learning Systems",
        "version": "",
        "focus": false
      }
    ]
  },
  {
    "title": "Beyond Biology",
    "blurb": "Same engine, different science \u2014 proof the platform generalises.",
    "pipelines": [
      {
        "name": "meerpipe",
        "description": "nf-core/meerpipe is a astronomy pipeline that processes MeerKAT pulsar data to produce images and data products for pulsar timing analysis",
        "version": "",
        "focus": false
      },
      {
        "name": "rangeland",
        "description": "Pipeline for remotely sensed imagery. The pipeline processes satellite imagery alongside auxiliary data in multiple steps to arrive at a set of trend files related to land-cover changes.",
        "version": "1.0.0",
        "focus": false
      },
      {
        "name": "troughgraph",
        "description": "A quantitative assessment of the underlying permafrost landscapes and, per extension, of the level of permafrost thaw in the region",
        "version": "",
        "focus": false
      },
      {
        "name": "spinningjenny",
        "description": "Pipeline for simulating the first industrial revolution using Agent Based Models.",
        "version": "",
        "focus": false
      }
    ]
  }
];

export const PIPELINE_COUNT = 142;
