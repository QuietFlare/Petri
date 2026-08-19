"""Generate petri-frontend/src/pipelineCatalog.js from the nf-core pipeline registry.

Categories are curated by hand — nf-core's own `topics` are too sparse and
inconsistent to group by automatically. Any pipeline not listed below lands in
"Unassigned" so it shows up loudly rather than being silently dropped.
"""
import json, re, textwrap
from pathlib import Path

OUT_PATH = Path(__file__).resolve().parent.parent / "petri-frontend" / "src" / "pipelineCatalog.js"

CATEGORIES = [
    ("Pathogens, Bacteria & AMR", "Bacterial isolates, outbreak tracking and resistance screening.", [
        "bacass", "funcscan", "bactmap", "bacmodel", "pathogensurveillance",
        "pathogenepidemiology", "tbanalyzer", "hgtseq", "phageannotator",
        "detaxizer", "createtaxdb", "viralrecon", "viralmetagenome", "viralintegration",
    ]),
    ("Metagenomics, Microbiome & Ancient DNA", "Mixed samples: who is present, and what can they do.", [
        "mag", "taxprofiler", "funcprofiler", "metatdenovo", "magmap", "ampliseq",
        "daamicrobiome", "metapep", "kmermaid", "eager", "coproid",
    ]),
    ("Genome Assembly & Annotation", "Building and describing reference sequences.", [
        "genomeassembler", "genomeannotator", "genomeqc", "genomeskim", "pangenome",
        "ncrnannotator", "pairgenomealign", "references",
    ]),
    ("Human Variants & Rare Disease", "Reference-based variant calling and clinical interpretation.", [
        "sarek", "raredisease", "longraredisease", "rarevariantburden", "gwas",
        "phaseimpute", "variantcatalogue", "variantbenchmarking", "variantprioritization",
        "genomicrelatedness", "createpanelrefs", "radseq", "mitodetect", "drop",
        "hlatyping", "abotyper", "deepmutscan", "omicsgenetraitassociation",
        "diseasemodulediscovery", "crisprseq", "pacvar",
    ]),
    ("Cancer Genomics", "Somatic variation, tumour evolution and drug response.", [
        "oncoanalyser", "tumourevo", "pacsomatic", "rnadnavar", "circdna", "drugresponseeval",
    ]),
    ("RNA & Transcriptomics", "Gene expression, splicing, fusions and non-coding RNA.", [
        "rnaseq", "rnasplice", "rnafusion", "rnavar", "smrnaseq", "riboseq", "circrna",
        "dualrnaseq", "denovotranscript", "nascent", "slamseq", "cageseq", "clipseq",
        "lncpipe", "isoseq", "rnastructurome", "alleleexpression", "stableexpression",
        "dartseq", "evexplorer", "differentialabundance", "nanostring",
    ]),
    ("Single-cell", "Per-cell resolution rather than bulk averages.", [
        "scrnaseq", "scnanoseq", "scdownstream", "marsseq", "hadge", "pixelator",
    ]),
    ("Epigenetics & Chromatin", "Methylation, accessibility and 3D genome structure.", [
        "methylseq", "methylong", "methylarray", "atacseq", "chipseq", "cutandrun",
        "mnaseseq", "hic", "hicar", "sammyseq", "epigenomesegmentation", "tfactivity",
        "callingcards",
    ]),
    ("Proteomics & Mass Spectrometry", "Peptides and metabolites measured by MS, not sequencing.", [
        "mhcquant", "diaproteomics", "mspepid", "metaboigniter", "proteogenomicsdb", "ribomsqc",
    ]),
    ("Protein Structure & Families", "Sequence to structure, orthology and evolution.", [
        "proteinfold", "proteinfamilies", "proteinannotator", "multiplesequencealign",
        "reportho", "genephylomodeler", "phyloplace",
    ]),
    ("Immunology & Antigens", "Immune receptors and antigen prediction.", [
        "airrflow", "epitopeprediction",
    ]),
    ("Imaging & Spatial Omics", "Microscopy and tissue-resolved measurement.", [
        "mcmicro", "imcyto", "molkart", "spatialvi", "spatialaxe", "sopa", "lsmquant",
        "panoramaseq", "cellpainting",
    ]),
    ("Utility & Infrastructure", "Plumbing: fetching, converting, QC, submission, provenance.", [
        "fetchngs", "demultiplex", "nanoseq", "bamtofastq", "fastqrepair", "seqinspector",
        "seqsubmit", "readsimulator", "datasync", "provenancereport", "demo", "fastquorum",
        "deepmodeloptim",
    ]),
    ("Beyond Biology", "Same engine, different science — proof the platform generalises.", [
        "meerpipe", "rangeland", "troughgraph", "spinningjenny",
    ]),
]

# Pipelines directly relevant to the AMR spearhead niche — highlighted in the UI.
AMR_FOCUS = {"bacass", "funcscan", "bactmap", "pathogensurveillance", "tbanalyzer",
             "hgtseq", "fetchngs"}

def latest_release(pipeline):
    """Newest stable release tag, or "" if the pipeline has never been released.

    The registry's `releases` list is NOT reliably ordered — bacass, for example,
    lists 2.6.0 before 2.6.1 — so sort by parsed version rather than trusting
    position. Tags vary in length ('3.1' alongside '3.4.4'), hence the padding.
    The 'dev' pseudo-release is excluded: it's a moving branch, not a version.
    """
    def key(tag):
        parts = [int(x) for x in re.findall(r"\d+", tag)][:3]
        return tuple(parts + [0] * (3 - len(parts)))

    tags = [r["tag_name"] for r in (pipeline.get("releases") or [])
            if r.get("tag_name") and r["tag_name"] != "dev"]
    return max(tags, key=key) if tags else ""


data = json.load(open("/tmp/nfcore.json"))
active = {p["name"]: p for p in data["remote_workflows"] if not p.get("archived")}

assigned, out = set(), []
for title, blurb, names in CATEGORIES:
    entries = []
    for n in names:
        p = active.get(n)
        if not p:
            print(f"  !! '{n}' not found in registry (renamed or archived?)")
            continue
        assigned.add(n)
        version = latest_release(p)
        entries.append({
            "name": n,
            "description": (p.get("description") or "").strip(),
            "version": version,
            "focus": n in AMR_FOCUS,
        })
    out.append({"title": title, "blurb": blurb, "pipelines": entries})

leftover = sorted(set(active) - assigned)
if leftover:
    print(f"  !! {len(leftover)} unassigned: {', '.join(leftover)}")
    out.append({
        "title": "Unassigned",
        "blurb": "Not yet categorised.",
        "pipelines": [{"name": n, "description": (active[n].get("description") or "").strip(),
                       "version": "", "focus": False} for n in leftover],
    })

total = sum(len(c["pipelines"]) for c in out)
header = textwrap.dedent(f'''\
    /**
     * nf-core pipeline catalogue — {total} active pipelines in {len(out)} domains.
     *
     * Generated from https://nf-co.re/pipelines.json (archived pipelines excluded).
     * Categories are curated, not from nf-core metadata: their `topics` field is too
     * sparse to group by. Regenerate with scripts/gen_catalog.py when nf-core adds
     * pipelines — this is a static snapshot so the page works offline.
     *
     * `focus: true` marks pipelines on the AMR path (bacass -> funcscan) that this
     * project is built around.
     */

    export const CATALOG = ''')

with open(OUT_PATH, "w") as f:
    f.write(header + json.dumps(out, indent=2) + ";\n")
    f.write(f"\nexport const PIPELINE_COUNT = {total};\n")

print(f"wrote catalog.js — {total} pipelines, {len(out)} categories")
