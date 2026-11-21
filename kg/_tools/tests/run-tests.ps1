#Requires -Version 7.2
<#
.SYNOPSIS
    Self-test for _tools\validate.ps1.
.DESCRIPTION
    1. Validates tests\fixture\good (must be clean, exit 0).
    2. Materializes one deliberately broken copy per check under tests\fixture\broken\<case>\
       (wiped and rebuilt on every run), validates each, and asserts the expected issue line appears
       (and, where given, that a line does not appear) and the exit code matches.
    3. Runs -WriteCatalog on a copy and checks the generated files, that nothing else changed,
       and that a second run changes nothing.
    -SyncSchema first refreshes fixture\good\_schema.md from the wiki's _schema.md, keeping the
    fixture's three-scheme vocab-schemes block.
#>
[CmdletBinding()]
param([switch]$SyncSchema)

$ErrorActionPreference = 'Stop'
$Here = $PSScriptRoot
$Validator = Join-Path (Split-Path -Parent $Here) 'validate.ps1'
$Good = Join-Path $Here 'fixture\good'
$BrokenRoot = Join-Path $Here 'fixture\broken'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$S = [string][char]0x00A7

if ($SyncSchema) {
    $wikiSchema = Join-Path (Split-Path -Parent (Split-Path -Parent $Here)) '_schema.md'
    $fxSchema = Join-Path $Good '_schema.md'
    $fxBlock = [regex]::Match([IO.File]::ReadAllText($fxSchema, $Utf8), '(?s)```vocab-schemes.*?```').Value
    $new = [regex]::Replace([IO.File]::ReadAllText($wikiSchema, $Utf8), '(?s)```vocab-schemes.*?```', { $fxBlock })
    [IO.File]::WriteAllText($fxSchema, $new, $Utf8)
    Write-Host "synced fixture _schema.md from $wikiSchema"
}

# Wipe only our own broken-copies folder.
if ((Test-Path -LiteralPath $BrokenRoot) -and $BrokenRoot.EndsWith('\tests\fixture\broken')) { Remove-Item -LiteralPath $BrokenRoot -Recurse -Force }
New-Item -ItemType Directory -Path $BrokenRoot | Out-Null

# ---------------------------------------------------------------- mutation helpers
function Get-F([string]$d, [string]$rel) { Join-Path $d $rel }
function Edit-F([string]$d, [string]$rel, [string]$old, [string]$new) {
    $p = Get-F $d $rel
    $t = [IO.File]::ReadAllText($p, $Utf8)
    if (-not $t.Contains($old)) { throw "test setup: '$old' not found in $rel" }
    [IO.File]::WriteAllText($p, $t.Replace($old, $new), $Utf8)
}
function Set-F([string]$d, [string]$rel, [string]$text) {
    $p = Get-F $d $rel
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $p) | Out-Null
    [IO.File]::WriteAllText($p, $text, $Utf8)
}
function Add-F([string]$d, [string]$rel, [string]$text) {
    $p = Get-F $d $rel; [IO.File]::WriteAllText($p, [IO.File]::ReadAllText($p, $Utf8) + $text, $Utf8)
}
function Remove-F([string]$d, [string]$rel) { Remove-Item -LiteralPath (Get-F $d $rel) -Force }

$BA = '02-treatment\behavioral-activation.md'
$BAIdx = '02-treatment\_index.md'
$PIT = '01-intake\pitfall-skipping-risk-screen.md'
$MOD = '05-conditions\depression\cbt-model.md'
$EMO = '_vocab\emotions.json'
$SIT = '_vocab\situations-triggers.json'
$FM = '_vocab\formulation-models.json'
$Words = (@('Practice the plan each day and note what changed in mood and energy.') * 120) -join ' '

# Each case: name, setup, regexes that must appear, regexes that must not appear, expected exit code.
$Cases = @(
    # ---- structure
    @{ N = 'missing-top-file'; X = 1; Do = { param($d) Remove-F $d '_playbook.md' }; E = @('^STRUCTURE \| _playbook\.md \| required top-level file is missing') }
    @{ N = 'container-holds-file'; X = 1; Do = { param($d) Set-F $d '05-conditions\notes.md' "# notes`n" }; E = @('^STRUCTURE \| 05-conditions \| has no _index\.md but holds files') }
    @{ N = 'leaf-without-index'; X = 1; Do = { param($d) Set-F $d '05-conditions\anxiety\x.md' "# x`n" }; E = @('^STRUCTURE \| 05-conditions\\anxiety \| leaf folder in a container has no _index\.md') }
    @{ N = 'empty-nn-folder'; X = 1; Do = { param($d) New-Item -ItemType Directory -Path (Get-F $d '09-empty') | Out-Null }; E = @('^STRUCTURE \| 09-empty \| empty folder') }
    @{ N = 'domain-subfolder'; X = 1; Do = { param($d) Set-F $d '01-intake\extra\y.md' "# y`n" }; E = @('^STRUCTURE \| 01-intake\\extra \| subfolder inside a domain') }
    @{ N = 'bad-file-name'; X = 1; Do = { param($d) Set-F $d '02-treatment\Bad_Name.md' "# x`n" }; E = @('^STRUCTURE \| 02-treatment\\Bad_Name\.md \| file name must be lowercase') }
    @{ N = 'non-markdown-file'; X = 1; Do = { param($d) Set-F $d '02-treatment\notes.txt' "x`n" }; E = @('^STRUCTURE \| 02-treatment\\notes\.txt \| not a Markdown page') }
    @{ N = 'domain-index-missing-heading'; X = 1; Do = { param($d) Edit-F $d '01-intake\_index.md' '## Decisions in order' '## Decisions' }; E = @("^STRUCTURE \| 01-intake\\_index\.md \| missing heading '## Decisions in order'") }
    @{ N = 'leaf-index-missing-heading'; X = 1; Do = { param($d) Edit-F $d '05-conditions\depression\_index.md' '## This surface' '## Surface' }; E = @("^STRUCTURE \| 05-conditions\\depression\\_index\.md \| missing heading '## This surface'") }
    @{ N = 'index-heading-order'; X = 1; Do = { param($d) Edit-F $d '01-intake\_index.md' '## This stage' '## This stage-x'; Add-F $d '01-intake\_index.md' "`n## This stage`nLate.`n" }; E = @("heading '## Decisions in order' is out of order|heading '## This stage' is out of order|missing heading") }
    @{ N = 'index-h1'; X = 1; Do = { param($d) Edit-F $d '01-intake\_index.md' '# 01-intake: Intake' '# Intake' }; E = @("^STRUCTURE \| 01-intake\\_index\.md \| H1 must read '# 01-intake: Title'") }
    @{ N = 'page-not-listed'; X = 1; Do = { param($d) $p = Get-F $d $BAIdx; $t = [IO.File]::ReadAllText($p, $Utf8) -replace '(?m)^\| `02-treatment\.behavioral-activation`.*\r?\n', ''; [IO.File]::WriteAllText($p, $t, $Utf8) }; E = @("page '02-treatment\.behavioral-activation' \(behavioral-activation\.md\) is not listed in the ## Pages table") }
    @{ N = 'page-listed-twice'; X = 1; Do = { param($d) $p = Get-F $d $BAIdx; $t = [IO.File]::ReadAllText($p, $Utf8) -replace '(?m)^(\| `02-treatment\.behavioral-activation`.*\r?\n)', '$1$1'; [IO.File]::WriteAllText($p, $t, $Utf8) }; E = @("page '02-treatment\.behavioral-activation' is listed 2 times") }
    @{ N = 'row-names-missing-page'; X = 1; Do = { param($d) Edit-F $d $BAIdx '|---|---|---|---|' "|---|---|---|---|`n| ``02-treatment.ghost`` | x | y | L2 |" }; E = @("## Pages row names '02-treatment\.ghost', which is not a page in this folder") }
    @{ N = 'pitfall-in-pages-table'; X = 1; Do = { param($d) Edit-F $d '01-intake\_index.md' '|---|---|---|---|' "|---|---|---|---|`n| ``01-intake.pitfall-skipping-risk-screen`` | x | y | L1 |" }; E = @("'01-intake\.pitfall-skipping-risk-screen' is listed under ## Pages but belongs under ## Pitfalls") }
    @{ N = 'router-missing-domain'; X = 1; Do = { param($d) Edit-F $d '_index.md' "| [02-treatment](02-treatment/_index.md) | Choosing and running interventions | Intake |`n" '' }; E = @("^STRUCTURE \| _index\.md \| ## Domains table has no row for '02-treatment'") }
    @{ N = 'router-extra-row'; X = 1; Do = { param($d) Edit-F $d '_index.md' '|---|---|---|' "|---|---|---|`n| [05-conditions](05-conditions/) | x | y |" }; E = @("## Domains row links '05-conditions', which is not a domain or leaf folder") }
    @{ N = 'router-row-not-link'; X = 1; Do = { param($d) Edit-F $d '_index.md' '[02-treatment](02-treatment/_index.md)' '02-treatment' }; E = @("## Domains row '02-treatment' is not a link"); NE = @("no row for '02-treatment'") }
    @{ N = 'router-duplicate-row'; X = 1; Do = { param($d) Edit-F $d '_index.md' '|---|---|---|' "|---|---|---|`n| [01-intake](./01-intake/) | again | x |" }; E = @("## Domains table lists '01-intake' 2 times") }
    # ---- page
    @{ N = 'no-frontmatter'; X = 0; Do = { param($d) Edit-F $d $BA "---`nid:" "id:" }; E = @("^PAGE \| 02-treatment\\behavioral-activation\.md \| no frontmatter") }
    @{ N = 'unclosed-frontmatter'; X = 0; Do = { param($d) Edit-F $d $BA "reviewed: 2026-11-06`n---" "reviewed: 2026-11-06`n" }; E = @("frontmatter has no closing '---' line") }
    @{ N = 'keys-out-of-order'; X = 0; Do = { param($d) Edit-F $d $BA "title: Behavioral Activation`ntype: intervention" "type: intervention`ntitle: Behavioral Activation" }; E = @('frontmatter keys are out of order') }
    @{ N = 'missing-key'; X = 0; Do = { param($d) $p = Get-F $d $BA; $t = [IO.File]::ReadAllText($p, $Utf8) -replace '(?m)^not_for:.*\n', ''; [IO.File]::WriteAllText($p, $t, $Utf8) }; E = @("missing required frontmatter key 'not_for'") }
    @{ N = 'unknown-key'; X = 0; Do = { param($d) Edit-F $d $BA 'reviewed: 2026-11-06' "author: someone`nreviewed: 2026-11-06" }; E = @("unknown frontmatter key 'author'") }
    @{ N = 'id-mismatch'; X = 0; Do = { param($d) Edit-F $d $BA 'id: 02-treatment.behavioral-activation' 'id: 02-treatment.ba' }; E = @("id '02-treatment\.ba' must be '02-treatment\.behavioral-activation'") }
    @{ N = 'bad-type'; X = 0; Do = { param($d) Edit-F $d $BA 'type: intervention' 'type: technique' }; E = @("type 'technique' is not in vocab-type") }
    @{ N = 'bad-depth'; X = 0; Do = { param($d) Edit-F $d $BA 'depth: L2' 'depth: L4' }; E = @("depth 'L4' is not in vocab-depth") }
    @{ N = 'bad-stage'; X = 0; Do = { param($d) Edit-F $d $BA 'stage: [treatment]' 'stage: [therapy]' }; E = @("stage value 'therapy' is not in vocab-stage") }
    @{ N = 'bad-topic'; X = 0; Do = { param($d) Edit-F $d $BA 'topics: [behavioral-activation, depression]' 'topics: [activity-scheduling, depression]' }; E = @("topics value 'activity-scheduling' is not in vocab-topics") }
    @{ N = 'stage-not-flow'; X = 0; Do = { param($d) Edit-F $d $BA 'stage: [treatment]' 'stage: treatment' }; E = @("'stage' must be a flow list") }
    @{ N = 'long-summary'; X = 0; Do = { param($d) Edit-F $d $BA 'summary: How to schedule' 'summary: One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen. How to schedule' }; E = @('summary has \d+ words \(maximum 30\)') }
    @{ N = 'no-bottom-line'; X = 0; Do = { param($d) Edit-F $d $BA '**Bottom line:** Behavioral' '**Summary:** Behavioral' }; E = @("body must start with a line beginning '\*\*Bottom line:\*\*'") }
    @{ N = 'related-bad-rel'; X = 0; Do = { param($d) Edit-F $d $BA 'rel: treats}' 'rel: cures}' }; E = @("related rel 'cures' is not in vocab-rel") }
    @{ N = 'related-missing-page'; X = 0; Do = { param($d) Edit-F $d $BA '{id: depression.cbt-model, rel: treats}' '{id: depression.missing, rel: treats}' }; E = @("related id 'depression\.missing' is not an existing page") }
    @{ N = 'related-not-map'; X = 0; Do = { param($d) Edit-F $d $BA '{id: depression.cbt-model, rel: treats}' 'depression.cbt-model' }; E = @("related item 'depression\.cbt-model' must be \{id: <page-id>, rel: <rel>\}") }
    @{ N = 'source-format'; X = 0; Do = { param($d) Edit-F $d $BA "Martell-etal-2010 $S Ch. 2" 'Martell-etal-2010 Ch. 2' }; E = @("sources entry 'Martell-etal-2010 Ch\. 2' does not match") }
    @{ N = 'source-key-missing'; X = 0; Do = { param($d) Edit-F $d $BA "NICE-NG222 $S 1.1" "NICE-NG999 $S 1.1" }; E = @("source key 'NICE-NG999' is not in _sources\.md", "inline citation \[NICE-NG222\] is not in this page's sources") }
    @{ N = 'inline-citation-not-in-sources'; X = 0; Do = { param($d) Edit-F $d $BA 'formats. It also' 'formats [Persons-2008; Beck-2021, p. 4]. It also' }; E = @("inline citation \[Persons-2008\] is not in this page's sources", "inline citation \[Beck-2021\] is not in this page's sources") }
    @{ N = 'maintainer-source-ok'; X = 0; Do = { param($d) Edit-F $d $BA "  - NICE-NG222 $S 1.1" "  - NICE-NG222 $S 1.1`n  - Maintainer/2026-11-06 $S current guidance"; Edit-F $d $BA 'formats. It also' 'formats [Maintainer/2026-11-06]. It also' }; E = @('^page issues: 0$') }
    @{ N = 'unknown-concept'; X = 0; Do = { param($d) Edit-F $d $BA 'concepts: [em.sad, sit.loss]' 'concepts: [em.happy, sit.loss]' }; E = @("concept 'em\.happy' is not defined in _vocab") }
    @{ N = 'em-dash'; X = 0; Do = { param($d) Edit-F $d $BA 'Low mood leads' ("Low mood " + [char]0x2014 + " leads") }; E = @('contains 1 em dash \(U\+2014\) character\(s\), first on line \d+') }
    @{ N = 'middle-dot'; X = 0; Do = { param($d) Edit-F $d $BA 'Low mood leads' ("Low mood " + [char]0x00B7 + " leads") }; E = @('contains 1 middle dot \(U\+00B7\)') }
    @{ N = 'too-few-words'; X = 0; Do = { param($d) $p = Get-F $d $BA; $t = [IO.File]::ReadAllText($p, $Utf8); $i = $t.IndexOf('## When to use'); [IO.File]::WriteAllText($p, $t.Substring(0, $i), $Utf8) }; E = @('body has \d+ words \(minimum 250\)') }
    @{ N = 'too-many-words'; X = 0; Do = { param($d) Add-F $d $BA "`n$Words`n" }; E = @('body has \d+ words \(maximum 1100\)') }
    @{ N = 'index-summary-not-verbatim'; X = 0; Do = { param($d) Edit-F $d $BAIdx '| How to schedule rewarding' '| How to plan rewarding' }; E = @('^PAGE \| 02-treatment\\behavioral-activation\.md \| Summary in 02-treatment\\_index\.md is not the frontmatter summary copied verbatim') }
    @{ N = 'index-applies-not-verbatim'; X = 0; Do = { param($d) Edit-F $d $BAIdx '| A client with low mood' '| Any client with low mood' }; E = @('Applies when in 02-treatment\\_index\.md is not the frontmatter applies_when copied verbatim') }
    @{ N = 'index-symptom-not-verbatim'; X = 0; Do = { param($d) Edit-F $d '01-intake\_index.md' '| The first session ends' '| The session ends' }; E = @('^PAGE \| 01-intake\\pitfall-skipping-risk-screen\.md \| Symptom in 01-intake\\_index\.md is not the frontmatter summary') }
    @{ N = 'index-whitespace-ok'; X = 0; Do = { param($d) Edit-F $d $BAIdx '| How to schedule rewarding' '|   How to schedule    rewarding' }; E = @('^page issues: 0$') }
    @{ N = 'index-depth-differs'; X = 0; Do = { param($d) Edit-F $d $BAIdx 'avoiding tasks. | L2 |' 'avoiding tasks. | L3 |' }; E = @("Depth 'L3' in 02-treatment\\_index\.md differs from frontmatter depth 'L2'") }
    @{ N = 'missing-body-heading'; X = 0; Do = { param($d) Edit-F $d $BA '## Evidence' '## Research' }; E = @("^PAGE \| 02-treatment\\behavioral-activation\.md \| missing heading '## Evidence'") }
    @{ N = 'body-heading-order'; X = 0; Do = { param($d) Edit-F $d $MOD '## Components' '## Drawing it with the client X'; Edit-F $d $MOD '## Drawing it with the client' '## Components'; Edit-F $d $MOD '## Components X' '## Drawing it with the client' }; E = @("heading '## Components' is out of order|heading '## Drawing it with the client' is out of order") }
    @{ N = 'unquoted-colon'; X = 0; Do = { param($d) Edit-F $d $BA 'title: Behavioral Activation' 'title: Behavioral Activation: Steps' }; E = @("'title' value contains ': ' or ' #' or starts with a reserved character, so it must be double-quoted") }
    @{ N = 'bad-reviewed'; X = 0; Do = { param($d) Edit-F $d $BA 'reviewed: 2026-11-06' 'reviewed: 2026-13-45' }; E = @("reviewed '2026-13-45' is not an ISO date") }
    @{ N = 'pitfall-type-mismatch'; X = 0; Do = { param($d) Edit-F $d $PIT 'type: pitfall' 'type: concept' }; E = @("pitfall-\*\.md file must have type 'pitfall', not 'concept'") }
    # ---- vocab
    @{ N = 'missing-scheme-file'; X = 1; Do = { param($d) Remove-F $d $EMO }; E = @('^VOCAB \| _vocab\\emotions\.json \| scheme file listed in vocab-schemes is missing'); NE = @("concept 'em\.sad' is not defined") }
    @{ N = 'json-parse-error'; X = 1; Do = { param($d) Edit-F $d $EMO '"version": "1.0.0",' '"version": "1.0.0",,' }; E = @('^VOCAB \| _vocab\\emotions\.json \| does not parse as JSON') }
    @{ N = 'prefix-mismatch'; X = 1; Do = { param($d) Edit-F $d $EMO '"prefix": "em"' '"prefix": "emo"' }; E = @("prefix 'emo' does not match 'em' from vocab-schemes") }
    @{ N = 'scheme-mismatch'; X = 1; Do = { param($d) Edit-F $d $EMO '"scheme": "emotions"' '"scheme": "feelings"' }; E = @("scheme 'feelings' does not match the file name 'emotions'") }
    @{ N = 'duplicate-concept-id'; X = 1; Do = { param($d) Edit-F $d $SIT '"id": "sit.work-demand"' '"id": "sit.loss"' }; E = @("id 'sit\.loss' is already defined in _vocab\\situations-triggers\.json") }
    @{ N = 'duplicate-id-across-schemes'; X = 1; Do = { param($d) Edit-F $d $FM '"id": "fm.five-part"' '"id": "em.sad"' }; E = @("^VOCAB \| _vocab\\formulation-models\.json \| id 'em\.sad' must be 'fm\.<slug>'", "^VOCAB \| _vocab\\emotions\.json \| id 'em\.sad' is already defined in _vocab\\formulation-models\.json") }
    @{ N = 'concept-id-prefix'; X = 1; Do = { param($d) Edit-F $d $EMO '"id": "em.anxious"' '"id": "sit.anxious"' }; E = @("id 'sit\.anxious' must be 'em\.<slug>'") }
    @{ N = 'broader-other-scheme'; X = 1; Do = { param($d) Edit-F $d $EMO '"broader": "em.sad"' '"broader": "sit.loss"' }; E = @("concept 'em\.guilty' broader 'sit\.loss' is not in the same scheme") }
    @{ N = 'broader-missing'; X = 1; Do = { param($d) Edit-F $d $EMO '"broader": "em.sad"' '"broader": "em.nothing"' }; E = @("concept 'em\.guilty' broader 'em\.nothing' is not an existing id") }
    @{ N = 'concept-related-missing'; X = 1; Do = { param($d) Edit-F $d $SIT '"em.sad"' '"em.nope"' }; E = @("concept 'sit\.loss' related 'em\.nope' is not an existing id") }
    @{ N = 'replaced-by-missing'; X = 1; Do = { param($d) Edit-F $d $EMO '"replaced_by": "em.sad"' '"replaced_by": "em.gone"' }; E = @("concept 'em\.down' replaced_by 'em\.gone' is not an existing id") }
    @{ N = 'fm-duplicate-slot'; X = 1; Do = { param($d) Edit-F $d $FM '"id": "behaviors"' '"id": "situation"' }; E = @("model 'fm\.five-part' slot id 'situation' is not unique", "model 'fm\.five-part' link from 'behaviors' is not a slot id") }
    @{ N = 'fm-vocab-prefix'; X = 1; Do = { param($d) Edit-F $d $FM '"sit"' '"xx"' }; E = @("slot 'situation' vocab prefix 'xx' is not in vocab-schemes") }
    @{ N = 'fm-rating'; X = 1; Do = { param($d) Edit-F $d $FM '"rating": "intensity"' '"rating": "strength"' }; E = @("slot 'emotions' rating 'strength' is not a key of rating_types") }
    @{ N = 'fm-outside-grid'; X = 1; Do = { param($d) Edit-F $d $FM '"col": 3' '"col": 4' }; E = @("slot 'emotions' at col 4, row 2 is outside the 3 x 3 grid") }
    @{ N = 'fm-link-end'; X = 1; Do = { param($d) Edit-F $d $FM '"to": "emotions"' '"to": "feelings"' }; E = @("link to 'feelings' is not a slot id") }
    @{ N = 'fm-page-missing'; X = 1; Do = { param($d) Edit-F $d $FM '"page": "depression.cbt-model"' '"page": "depression.nope"' }; E = @("model 'fm\.five-part' page 'depression\.nope' is not an existing page id") }
    @{ N = 'fm-link-style'; X = 1; Do = { param($d) Edit-F $d $FM '"style": "dashed"' '"style": "dotted"' }; E = @("link style 'dotted' must be solid or dashed") }
    # ---- style
    @{ N = 'avoid-forms'; X = 0; Do = { param($d) Edit-F $d $BA 'formats. It also' 'formats, like behavioural experiments and a thought diary. It also' }; E = @("^STYLE \| 02-treatment\\behavioral-activation\.md \| uses 'behavioural experiments' \(1x\): canonical form is 'behavioral experiment'", '^style warnings: 1$'); NE = @('thought diary') }
    # ---- contract is read, not hardcoded
    @{ N = 'schema-drives-vocab'; X = 1; Do = { param($d) Edit-F $d '_schema.md' "concept model procedure intervention" "concept model procedure intervention technique"; Edit-F $d $BA 'type: intervention' 'type: technique' }; E = @("^STRUCTURE \| _schema\.md \| section 7 has no heading template for page type 'technique'"); NE = @("type 'technique' is not in vocab-type") }
    @{ N = 'glossary-markers-missing'; X = 1; W = $true; Do = { param($d) Edit-F $d '_glossary.md' '<!-- END GENERATED: controlled-vocabulary -->' '' }; E = @('^STRUCTURE \| _glossary\.md \| cannot regenerate') }
)

# ---------------------------------------------------------------- materialize and run
$results = [System.Collections.Generic.List[object]]::new()
function Invoke-Validator([string]$Dir, [switch]$Write) {
    $a = @('-NoProfile', '-File', $Validator, '-Root', $Dir); if ($Write) { $a += '-WriteCatalog' }
    $out = & pwsh @a 2>&1 | ForEach-Object { "$_" }
    return [pscustomobject]@{ Out = @($out); Exit = $LASTEXITCODE }
}
$fail = 0
function Report([string]$name, [bool]$ok, [string]$why) {
    if ($ok) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name : $why"; $script:fail++ }
}

$r = Invoke-Validator $Good
$clean = ($r.Exit -eq 0) -and -not ($r.Out | Where-Object { $_ -match '^(STRUCTURE|PAGE|VOCAB|STYLE) \|' })
Report 'good-fixture-is-clean' $clean ($r.Out -join ' / ')

$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
foreach ($c in $Cases) {
    $dir = Join-Path $BrokenRoot $c.N
    Copy-Item -LiteralPath $Good -Destination $dir -Recurse
    & $c.Do $dir
}
$runs = $Cases | ForEach-Object -ThrottleLimit 8 -Parallel {
    $c = $_
    $dir = Join-Path $using:BrokenRoot $c.N
    $a = @('-NoProfile', '-File', $using:Validator, '-Root', $dir); if ($c.W) { $a += '-WriteCatalog' }
    $out = & pwsh @a 2>&1 | ForEach-Object { "$_" }
    [pscustomobject]@{ N = $c.N; Out = @($out); Exit = $LASTEXITCODE }
}
$byName = @{}; foreach ($x in $runs) { $byName[$x.N] = $x }
foreach ($c in $Cases) {
    $x = $byName[$c.N]; $why = @()
    foreach ($e in $c.E) { if (-not ($x.Out | Where-Object { $_ -match $e })) { $why += "missing /$e/" } }
    foreach ($e in @($c.NE)) { if ($e -and ($x.Out | Where-Object { $_ -match $e })) { $why += "unexpected /$e/" } }
    if ($x.Exit -ne $c.X) { $why += "exit $($x.Exit), expected $($c.X)" }
    Report $c.N ($why.Count -eq 0) (($why -join '; ') + ' | output: ' + ($x.Out -join ' / '))
}

# ---------------------------------------------------------------- -WriteCatalog
$wdir = Join-Path $BrokenRoot '_write-catalog'
Copy-Item -LiteralPath $Good -Destination $wdir -Recurse
function Get-Snapshot([string]$d) {
    $h = @{}
    Get-ChildItem -LiteralPath $d -Recurse -File | ForEach-Object { $h[$_.FullName.Substring($d.Length + 1)] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
    return $h
}
$before = Get-Snapshot $wdir
$r = Invoke-Validator $wdir -Write
Report 'write: exit 0 and clean' (($r.Exit -eq 0) -and ($r.Out -contains 'page issues: 0')) ($r.Out -join ' / ')
$after = Get-Snapshot $wdir
$allowed = @('_catalog.yaml', '_graph.json', '_glossary.md', $EMO, $SIT)
$changed = @($after.Keys | Where-Object { $before[$_] -ne $after[$_] })
$bad = @($changed | Where-Object { $_ -notin $allowed })
Report 'write: touches only generated files' ($bad.Count -eq 0) ("changed: " + ($bad -join ', '))
Report 'write: formulation-models.json untouched' ($before[$FM] -eq $after[$FM]) 'changed'

$cat = [IO.File]::ReadAllText((Join-Path $wdir '_catalog.yaml'), $Utf8)
Report 'write: catalog has one entry per page' (([regex]::Matches($cat, '(?m)^- file: ')).Count -eq 4) $cat
Report 'write: catalog keeps quoting rule' ($cat.Contains('  title: "Depression: The CBT Model"') -and $cat.Contains("    - {id: depression.cbt-model, rel: treats}")) $cat

$g = [IO.File]::ReadAllText((Join-Path $wdir '_graph.json'), $Utf8) | ConvertFrom-Json -DateKind String
$kinds = ($g.nodes | Group-Object kind | ForEach-Object { "$($_.Name)=$($_.Count)" } | Sort-Object) -join ','
Report 'write: graph node kinds' ($kinds -eq 'concept=7,domain=3,model=1,page=4,source=4') $kinds
$rels = @($g.edges | ForEach-Object rel | Sort-Object -Unique) -join ','
Report 'write: graph edge rels' ($rels -eq 'broader,caution,cites,concept-related,in-domain,prerequisite,see-also,slot-uses,tags,treats') $rels

$emoText = [IO.File]::ReadAllText((Join-Path $wdir $EMO), $Utf8)
Report 'write: see arrays rewritten' ($emoText.Contains('"see": ["02-treatment.behavioral-activation", "depression.cbt-model"],') -and $emoText.Contains('"see": ["01-intake.presenting-problem"],')) $emoText
Report 'write: missing see inserted after related' ($emoText -match '"related": \[\],\n      "see": \["depression\.cbt-model"\],\n      "sources"') 'not found'
$bytes = [IO.File]::ReadAllBytes((Join-Path $wdir $EMO))
Report 'write: vocab stays UTF-8 without BOM' ($bytes[0] -ne 0xEF) 'BOM found'
$emoObj = $emoText | ConvertFrom-Json
Report 'write: vocab still parses, order kept' ((@($emoObj.concepts[0].PSObject.Properties.Name) -join ',') -eq 'id,label,alt_labels,definition,client_wording,example,group,broader,related,see,sources,valence') 'order changed'

$gl = [IO.File]::ReadAllText((Join-Path $wdir '_glossary.md'), $Utf8)
Report 'write: glossary block regenerated' ($gl.Contains('#### Emotions') -and $gl.Contains('#### Situations and triggers') -and $gl.Contains('| Sad | Low, down or unhappy feeling. | `em.sad` |') -and -not $gl.Contains('stale content')) $gl
Report 'write: glossary skips deprecated, escapes pipes' ((-not $gl.Contains('`em.down`')) -and $gl.Contains('done wrong \| let someone down')) $gl
Report 'write: glossary text outside markers kept' ($gl.StartsWith("# Glossary`n`n## Terms") -and $gl.EndsWith("Footer text that must survive regeneration.`n")) $gl

$snap1 = Get-Snapshot $wdir
$r = Invoke-Validator $wdir -Write
$snap2 = Get-Snapshot $wdir
$diff = @($snap2.Keys | Where-Object { $snap1[$_] -ne $snap2[$_] })
Report 'write: second run changes nothing' ($diff.Count -eq 0) ($diff -join ', ')

$total = $Cases.Count + 17
Write-Host ''
Write-Host "$($total - $fail) of $total passed"
if ($fail -gt 0) { exit 1 }
exit 0
