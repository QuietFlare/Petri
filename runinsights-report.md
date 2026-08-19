# nf-runinsights report

- **Pipeline:** nf-core/sarek
- **Run:** prickly_albattani
- **Time:** 2026-08-19T11:07:25.683239+02:00
- **Prior runs in history:** 5

## Findings

- **overprovision** (info): NFCORE_SAREK:PREPARE_INTERVALS:CREATE_INTERVALS_BED: peak memory 6.3 MB never exceeded 25% of the 1.0 GB requested (6 sample(s))
- **overprovision** (info): NFCORE_SAREK:PREPARE_INTERVALS:TABIX_BGZIPTABIX_INTERVAL_SPLIT: peak memory 11 MB never exceeded 25% of the 1.0 GB requested (6 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQC: peak memory 592 MB never exceeded 25% of the 4.0 GB requested (5 sample(s))
- **overprovision** (info): NFCORE_SAREK:PREPARE_INTERVALS:GATK4_INTERVALLISTTOBED: peak memory 412 MB never exceeded 25% of the 12 GB requested (5 sample(s))
- **overprovision** (info): NFCORE_SAREK:PREPARE_INTERVALS:TABIX_BGZIPTABIX_INTERVAL_COMBINED: peak memory 6.8 MB never exceeded 25% of the 1.0 GB requested (5 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:FASTQ_ALIGN:BWAMEM1_MEM: peak memory 643 MB never exceeded 25% of the 15 GB requested (5 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_MARKDUPLICATES:CRAM_QC_MOSDEPTH_SAMTOOLS:MOSDEPTH: peak memory 6.3 MB never exceeded 25% of the 4.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_MARKDUPLICATES:CRAM_QC_MOSDEPTH_SAMTOOLS:SAMTOOLS_STATS: peak memory 38 MB never exceeded 25% of the 6.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_BASERECALIBRATOR:GATK4_BASERECALIBRATOR: peak memory 613 MB never exceeded 25% of the 4.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_APPLYBQSR:GATK4_APPLYBQSR: peak memory 546 MB never exceeded 25% of the 4.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_APPLYBQSR:CRAM_MERGE_INDEX_SAMTOOLS:INDEX_CRAM: peak memory 6.4 MB never exceeded 25% of the 1.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:CRAM_SAMPLEQC:CRAM_QC_RECAL:SAMTOOLS_STATS: peak memory 6.3 MB never exceeded 25% of the 6.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:CRAM_SAMPLEQC:CRAM_QC_RECAL:MOSDEPTH: peak memory 6.3 MB never exceeded 25% of the 4.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:BAM_VARIANT_CALLING_GERMLINE_ALL:BAM_VARIANT_CALLING_SINGLE_STRELKA:STRELKA_SINGLE: peak memory 148 MB never exceeded 25% of the 8.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:VCFTOOLS_TSTV_QUAL: peak memory 7.9 MB never exceeded 25% of the 1.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:VCFTOOLS_SUMMARY: peak memory 7.9 MB never exceeded 25% of the 1.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:VCFTOOLS_TSTV_COUNT: peak memory 7.9 MB never exceeded 25% of the 1.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:BCFTOOLS_STATS: peak memory 6.7 MB never exceeded 25% of the 1.0 GB requested (4 sample(s))
- **overprovision** (info): NFCORE_SAREK:SAREK:MULTIQC: peak memory 1.3 GB never exceeded 25% of the 12 GB requested (4 sample(s))

## Processes (this run vs history)

| Process | Tasks | Median time | Hist. median | Peak RSS | Mem req |
|---|---|---|---|---|---|
| NFCORE_SAREK:PREPARE_INTERVALS:CREATE_INTERVALS_BED | 1 | 0.0s | 0.0s | 6.3 MB | 1.0 GB |
| NFCORE_SAREK:PREPARE_GENOME:BWAMEM1_INDEX | 1 | 0.3s | 0.4s | 6.8 MB | 238 KB |
| NFCORE_SAREK:PREPARE_INTERVALS:TABIX_BGZIPTABIX_INTERVAL_SPLIT | 1 | 0.2s | 0.4s | 6.8 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:FASTQC | 5 | 13.0s | 12.0s | 536 MB | 4.0 GB |
| NFCORE_SAREK:PREPARE_INTERVALS:GATK4_INTERVALLISTTOBED | 1 | 8.3s | 9.8s | 341 MB | 12 GB |
| NFCORE_SAREK:PREPARE_INTERVALS:TABIX_BGZIPTABIX_INTERVAL_COMBINED | 1 | 0.2s | 0.3s | 6.8 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:FASTQ_ALIGN:BWAMEM1_MEM | 5 | 7.0s | 6.7s | 642 MB | 15 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_MARKDUPLICATES:GATK4_MARKDUPLICATES | 5 | 13.5s | 12.6s | 4.8 GB | 15 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_MARKDUPLICATES:CRAM_QC_MOSDEPTH_SAMTOOLS:MOSDEPTH | 5 | 0.0s | 0.0s | 6.3 MB | 4.0 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_MARKDUPLICATES:CRAM_QC_MOSDEPTH_SAMTOOLS:SAMTOOLS_STATS | 5 | 1.0s | 2.0s | 38 MB | 6.0 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_BASERECALIBRATOR:GATK4_BASERECALIBRATOR | 5 | 37.8s | 29.3s | 613 MB | 4.0 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_APPLYBQSR:GATK4_APPLYBQSR | 5 | 21.1s | 19.3s | 520 MB | 4.0 GB |
| NFCORE_SAREK:SAREK:FASTQ_PREPROCESS_GATK:BAM_APPLYBQSR:CRAM_MERGE_INDEX_SAMTOOLS:INDEX_CRAM | 5 | 0.0s | 0.0s | 6.3 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:CRAM_SAMPLEQC:CRAM_QC_RECAL:SAMTOOLS_STATS | 5 | 0.0s | 0.0s | 6.3 MB | 6.0 GB |
| NFCORE_SAREK:SAREK:CRAM_SAMPLEQC:CRAM_QC_RECAL:MOSDEPTH | 5 | 1.0s | 0.0s | 6.3 MB | 4.0 GB |
| NFCORE_SAREK:SAREK:BAM_VARIANT_CALLING_GERMLINE_ALL:BAM_VARIANT_CALLING_SINGLE_STRELKA:STRELKA_SINGLE | 5 | 19.0s | 21.0s | 148 MB | 8.0 GB |
| NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:VCFTOOLS_TSTV_QUAL | 5 | 1.0s | 0.0s | 7.9 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:VCFTOOLS_SUMMARY | 5 | 1.0s | 0.0s | 7.9 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:VCFTOOLS_TSTV_COUNT | 5 | 1.0s | 0.0s | 7.9 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:VCF_QC_BCFTOOLS_VCFTOOLS:BCFTOOLS_STATS | 5 | 0.3s | 0.4s | 6.7 MB | 1.0 GB |
| NFCORE_SAREK:SAREK:MULTIQC | 1 | 17.5s | 17.0s | 1.2 GB | 12 GB |
