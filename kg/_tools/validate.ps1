#Requires -Version 7.2
<#
.SYNOPSIS
    Validator and generator for the CBT Knowledge Graph (contract: <root>\_schema.md).
.DESCRIPTION
    Checks structure, pages, vocabulary and style against the contract. With -WriteCatalog it also
    writes _catalog.yaml and _graph.json, rewrites the "see" arrays in the _vocab concept schemes and
    regenerates the controlled-vocabulary block of _glossary.md. See _tools\README.md.
    Output: one line per issue ("CATEGORY | relative path | message"), then six tail lines.
    Exit code: 1 when structure or vocab issues exist, else 0 (2 when the root is unusable).
.PARAMETER Root
    Wiki root. Defaults to the parent of the folder holding this script.
.PARAMETER WriteCatalog
    Also write the generated files.
#>
[CmdletBinding()]
param(
    [string]$Root,
    [switch]$WriteCatalog
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Off
try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false) } catch { }

# ---------------------------------------------------------------------------------------------------
# Constants (tool settings, not controlled vocabularies: those are read from _schema.md)
# ---------------------------------------------------------------------------------------------------
$RequiredTopFiles = @('_index.md', '_schema.md', '_sources.md', '_glossary.md', '_playbook.md', '_overview.md', '_maintenance.md')
$MinBodyWords = 250
$MaxBodyWords = 1100
$MaxSummaryWords = 30
$GlossaryBegin = '<!-- BEGIN GENERATED: controlled-vocabulary -->'
$GlossaryEnd = '<!-- END GENERATED: controlled-vocabulary -->'
$EmDash = [string][char]0x2014
$MidDot = [string][char]0x00B7
$SectionSign = [string][char]0x00A7
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$Ord = [System.StringComparer]::Ordinal
$Today = (Get-Date).ToString('yyyy-MM-dd')

$SourceEntryRx = [regex]::new('^(?<key>Maintainer/\d{4}-\d{2}-\d{2}|[A-Za-z0-9][A-Za-z0-9-]*) ' + $SectionSign + ' (?<loc>\S.*)$')
$MaintainerRx = [regex]::new('^Maintainer/\d{4}-\d{2}-\d{2}$')
$InlineKeyRx = [regex]::new('^(?:Maintainer/\d{4}-\d{2}-\d{2}|[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+)$')
$BracketRx = [regex]::new('\[([^\[\]\r\n]+)\](?![\(\[:])')
$CodeSpanRx = [regex]::new('`[^`\r\n]*`')
$WordRx = [regex]::new('\S*[\p{L}\p{N}]\S*')
$JsonTokRx = [regex]::new('"(?:[^"\\]|\\.)*"|[{}\[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null')

# ---------------------------------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------------------------------
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
    [Console]::Error.WriteLine("validate.ps1: root folder not found: $Root")
    exit 2
}

# ---------------------------------------------------------------------------------------------------
# Issue collection and small helpers
# ---------------------------------------------------------------------------------------------------
$Issues = [ordered]@{
    STRUCTURE = [System.Collections.Generic.List[string]]::new()
    PAGE      = [System.Collections.Generic.List[string]]::new()
    VOCAB     = [System.Collections.Generic.List[string]]::new()
    STYLE     = [System.Collections.Generic.List[string]]::new()
}
function Add-Issue([string]$Cat, [string]$Path, [string]$Msg) {
    $Issues[$Cat].Add("$Cat | $Path | $Msg")
}
function Get-Rel([string]$Full) {
    if ($Full.StartsWith($Root + '\', [StringComparison]::OrdinalIgnoreCase)) { return $Full.Substring($Root.Length + 1) }
    return $Full
}
function Read-Text([string]$Path) { return [System.IO.File]::ReadAllText($Path, $Utf8) }
function Split-Lines([string]$Text) { return , ($Text -split '\r?\n') }
function New-StrSet { return , ([System.Collections.Generic.HashSet[string]]::new($Ord)) }
function New-Dict { return , ([System.Collections.Generic.Dictionary[string, object]]::new($Ord)) }
function Get-WordCount([string]$Text) { if (-not $Text) { return 0 }; return $WordRx.Matches($Text).Count }
function Format-Ws([string]$s) { if ($null -eq $s) { return '' }; return ($s -replace '\s+', ' ').Trim() }
function Write-IfChanged([string]$Path, [string]$Text) {
    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        if ((Read-Text $Path) -ceq $Text) { return }
    }
    [System.IO.File]::WriteAllText($Path, $Text, $Utf8)
}
# JSON property access that never throws (PSCustomObject from ConvertFrom-Json)
function Get-P($o, [string]$Name) {
    if ($null -eq $o -or $o -isnot [System.Management.Automation.PSCustomObject]) { return $null }
    $p = $o.PSObject.Properties[$Name]
    if ($p) { return , $p.Value }
    return $null
}
function Test-HasP($o, [string]$Name) {
    return ($null -ne $o -and $o -is [System.Management.Automation.PSCustomObject] -and $null -ne $o.PSObject.Properties[$Name])
}
function Get-Arr($o, [string]$Name) {
    $v = Get-P $o $Name
    if ($null -eq $v) { return , @() }
    return , @($v)
}
function Test-IsInt($v) { return ($v -is [int] -or $v -is [long] -or $v -is [int16] -or $v -is [byte]) }

# Check that $Required headings appear in $Found, in order (extra headings allowed).
function Test-HeadingOrder($Found, [string[]]$Required, [string]$Cat, [string]$Path) {
    $last = -1
    foreach ($h in $Required) {
        $i = $Found.IndexOf($h)
        if ($i -lt 0) { Add-Issue $Cat $Path "missing heading '## $h'" }
        elseif ($i -lt $last) { Add-Issue $Cat $Path "heading '## $h' is out of order (expected order: $($Required -join ', '))" }
        else { $last = $i }
    }
}

# ---------------------------------------------------------------------------------------------------
# Markdown helpers (indexes, tables)
# ---------------------------------------------------------------------------------------------------
function Read-Markdown([string]$Text) {
    $lines = Split-Lines $Text
    $h1 = $null
    $headings = [System.Collections.Generic.List[string]]::new()
    $sections = New-Dict
    $cur = $null; $inFence = $false
    foreach ($l in $lines) {
        if ($l -match '^\s*(```|~~~)') { $inFence = -not $inFence; if ($cur) { $sections[$cur].Add($l) }; continue }
        if (-not $inFence -and $null -eq $h1 -and $l -cmatch '^# (.+?)\s*$') { $h1 = $Matches[1]; continue }
        if (-not $inFence -and $l -cmatch '^## (.+?)\s*#*\s*$') {
            $cur = $Matches[1].Trim()
            $headings.Add($cur)
            if (-not $sections.ContainsKey($cur)) { $sections[$cur] = [System.Collections.Generic.List[string]]::new() }
            continue
        }
        if ($cur) { $sections[$cur].Add($l) }
    }
    return [pscustomobject]@{ H1 = $h1; Headings = $headings; Sections = $sections }
}
function Split-Row([string]$Line) {
    $t = $Line.Trim()
    if ($t.StartsWith('|')) { $t = $t.Substring(1) }
    if ($t.EndsWith('|') -and -not $t.EndsWith('\|')) { $t = $t.Substring(0, $t.Length - 1) }
    $cells = [regex]::Split($t, '(?<!\\)\|')
    return , @($cells | ForEach-Object { $_.Trim().Replace('\|', '|') })
}
function Get-Tables($Lines) {
    $tables = [System.Collections.Generic.List[object]]::new()
    $cur = $null
    foreach ($l in $Lines) {
        if ($l -match '^\s*\|') {
            $cells = Split-Row $l
            if ($null -eq $cur) {
                $cur = [pscustomobject]@{ Header = $cells; Rows = [System.Collections.Generic.List[object]]::new() }
                $tables.Add($cur)
            }
            elseif (($cells -join '') -match '^[\s:\-]+$') { continue }
            else { $cur.Rows.Add($cells) }
        }
        else { $cur = $null }
    }
    return , $tables
}
function Get-CellId([string]$Cell) {
    if ($Cell -match '`([^`]+)`') { return $Matches[1].Trim() }
    if ($Cell -match '\[([^\]]+)\]\(') { return $Matches[1].Trim() }
    return $Cell.Trim()
}
function Get-Col($Header, [string]$Name) {
    for ($i = 0; $i -lt $Header.Count; $i++) { if ($Header[$i].Trim() -eq $Name) { return $i } }
    return -1
}
function Get-Cell($Row, [int]$i) { if ($i -ge 0 -and $i -lt $Row.Count) { return $Row[$i] }; return $null }

# ---------------------------------------------------------------------------------------------------
# Restricted YAML subset (schema section 4)
# ---------------------------------------------------------------------------------------------------
function Split-Flow([string]$Inner) {
    $parts = [System.Collections.Generic.List[string]]::new()
    $sb = [System.Text.StringBuilder]::new(); $depth = 0; $inQ = $false
    for ($i = 0; $i -lt $Inner.Length; $i++) {
        $ch = $Inner[$i]
        if ($inQ) {
            [void]$sb.Append($ch)
            if ($ch -eq [char]'\' -and $i + 1 -lt $Inner.Length) { $i++; [void]$sb.Append($Inner[$i]) }
            elseif ($ch -eq [char]'"') { $inQ = $false }
            continue
        }
        if ($ch -eq [char]'"') { $inQ = $true; [void]$sb.Append($ch); continue }
        if ($ch -eq [char]'{' -or $ch -eq [char]'[' -or $ch -eq [char]'(') { $depth++ }
        elseif ($ch -eq [char]'}' -or $ch -eq [char]']' -or $ch -eq [char]')') { $depth-- }
        if ($ch -eq [char]',' -and $depth -eq 0) { $parts.Add($sb.ToString().Trim()); [void]$sb.Clear(); continue }
        [void]$sb.Append($ch)
    }
    $last = $sb.ToString().Trim()
    if ($last -ne '' -or $parts.Count -gt 0) { $parts.Add($last) }
    return , $parts
}
function ConvertFrom-Scalar([string]$s) {
    $s = $s.Trim()
    if ($s.Length -ge 2 -and $s.StartsWith('"') -and $s.EndsWith('"') -and -not $s.EndsWith('\"')) {
        return [pscustomobject]@{ IsMap = $false; Value = [regex]::Replace($s.Substring(1, $s.Length - 2), '\\(.)', '$1'); Quoted = $true; NeedsQuote = $false; Bad = $false; Map = $null }
    }
    $needs = $s.Contains(': ') -or $s.Contains(' #') -or ($s -match '^[\[\{"*&!|>%@]')
    return [pscustomobject]@{ IsMap = $false; Value = $s; Quoted = $false; NeedsQuote = $needs; Bad = $s.StartsWith('"'); Map = $null }
}
function ConvertFrom-Item([string]$s) {
    $s = $s.Trim()
    if ($s.StartsWith('{') -and $s.EndsWith('}')) {
        $map = [ordered]@{}; $bad = $false
        foreach ($part in (Split-Flow $s.Substring(1, $s.Length - 2))) {
            if ($part -match '^([^:]+):\s*(.*)$') { $map[$Matches[1].Trim()] = (ConvertFrom-Scalar $Matches[2]).Value }
            else { $bad = $true }
        }
        return [pscustomobject]@{ IsMap = $true; Value = $s; Quoted = $false; NeedsQuote = $false; Bad = $bad; Map = $map }
    }
    return ConvertFrom-Scalar $s
}
function Read-Frontmatter($Lines) {
    $r = [pscustomobject]@{ Ok = $false; Error = $null; Entries = (New-Dict); Order = [System.Collections.Generic.List[string]]::new(); Errors = [System.Collections.Generic.List[string]]::new(); End = -1 }
    if ($Lines.Count -eq 0 -or $Lines[0].TrimEnd() -cne '---') { $r.Error = "no frontmatter: the file must start with a '---' line"; return $r }
    $end = -1
    for ($i = 1; $i -lt $Lines.Count; $i++) { if ($Lines[$i].TrimEnd() -ceq '---') { $end = $i; break } }
    if ($end -lt 0) { $r.Error = "frontmatter has no closing '---' line"; return $r }
    $r.End = $end; $r.Ok = $true
    $cur = $null
    for ($i = 1; $i -lt $end; $i++) {
        $l = $Lines[$i]
        if ($l.Trim() -eq '') { continue }
        if ($l -match '^\s*-(?:\s+(.*))?$') {
            if ($cur -and ($cur.Kind -eq 'block' -or $cur.Kind -eq 'empty')) {
                $cur.Kind = 'block'
                $cur.Items.Add((ConvertFrom-Item ([string]$Matches[1])))
            }
            else { $r.Errors.Add("line $($i + 1): list item outside a block list") }
            continue
        }
        if ($l -cmatch '^([A-Za-z_][A-Za-z0-9_-]*):(?:\s+(.*))?$') {
            $key = $Matches[1]; $val = ([string]$Matches[2]).Trim()
            $e = [pscustomobject]@{ Key = $key; Kind = 'scalar'; Scalar = $null; Items = [System.Collections.Generic.List[object]]::new(); Line = $i + 1 }
            if ($val -eq '') { $e.Kind = 'empty' }
            elseif ($val.StartsWith('[')) {
                if (-not $val.EndsWith(']')) { $r.Errors.Add("line $($i + 1): flow list for '$key' must open and close on one line") }
                $e.Kind = 'flow'
                $inner = $val.TrimStart('[').TrimEnd(']')
                foreach ($p in (Split-Flow $inner)) { if ($p -ne '') { $e.Items.Add((ConvertFrom-Scalar $p)) } }
            }
            elseif ($val.StartsWith('{')) { $e.Kind = 'map'; $e.Scalar = ConvertFrom-Item $val }
            else { $e.Scalar = ConvertFrom-Scalar $val }
            if ($r.Entries.ContainsKey($key)) { $r.Errors.Add("line $($i + 1): duplicate key '$key'") }
            else { $r.Entries[$key] = $e; $r.Order.Add($key) }
            $cur = $e
            continue
        }
        $r.Errors.Add("line $($i + 1): not a 'key: value' line or list item: '$($l.Trim())'")
        $cur = $null
    }
    return $r
}
function Get-FmScalar($Fm, [string]$Key) {
    $e = $null
    if ($Fm -and $Fm.Ok -and $Fm.Entries.TryGetValue($Key, [ref]$e) -and $e.Kind -eq 'scalar') { return $e.Scalar.Value }
    return $null
}
function Get-FmItems($Fm, [string]$Key) {
    $e = $null
    if ($Fm -and $Fm.Ok -and $Fm.Entries.TryGetValue($Key, [ref]$e) -and ($e.Kind -eq 'flow' -or $e.Kind -eq 'block' -or $e.Kind -eq 'empty')) { return , $e.Items }
    return , ([System.Collections.Generic.List[object]]::new())
}
function Format-YamlScalar([string]$s) {
    if ($null -eq $s) { return '""' }
    if ($s -eq '' -or $s.Contains(': ') -or $s.Contains(' #') -or ($s -match '^[\[\{"*&!|>%@]') -or $s -ne $s.Trim()) {
        return '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"'
    }
    return $s
}

# ---------------------------------------------------------------------------------------------------
# 1. The contract: _schema.md
# ---------------------------------------------------------------------------------------------------
$schemaPath = Join-Path $Root '_schema.md'
$schemaText = if (Test-Path -LiteralPath $schemaPath -PathType Leaf) { Read-Text $schemaPath } else { '' }

$Blocks = New-Dict
foreach ($m in [regex]::Matches($schemaText, '(?ms)^```(vocab-[a-z]+)[ \t]*\r?\n(.*?)^```')) { $Blocks[$m.Groups[1].Value] = $m.Groups[2].Value }
function Get-VocabSet([string]$Name) {
    $set = New-StrSet
    if (-not $Blocks.ContainsKey($Name)) { if ($schemaText) { Add-Issue STRUCTURE '_schema.md' "missing fenced block '$Name'" }; return , $set }
    foreach ($w in ($Blocks[$Name] -split '\s+')) { if ($w) { [void]$set.Add($w) } }
    return , $set
}
$TypeSet = Get-VocabSet 'vocab-type'
$DepthSet = Get-VocabSet 'vocab-depth'
$StageSet = Get-VocabSet 'vocab-stage'
$TopicSet = Get-VocabSet 'vocab-topics'
$RelSet = Get-VocabSet 'vocab-rel'

$Schemes = [System.Collections.Generic.List[object]]::new()
if ($Blocks.ContainsKey('vocab-schemes')) {
    foreach ($l in (Split-Lines $Blocks['vocab-schemes'])) {
        $t = $l.Trim(); if (-not $t) { continue }
        $p = $t -split '\s+'
        if ($p.Count -ne 2) { Add-Issue STRUCTURE '_schema.md' "vocab-schemes line is not 'prefix file': '$t'"; continue }
        $Schemes.Add([pscustomobject]@{ Prefix = $p[0]; File = $p[1] })
    }
}
elseif ($schemaText) { Add-Issue STRUCTURE '_schema.md' "missing fenced block 'vocab-schemes'" }
$PrefixSet = New-StrSet; foreach ($s in $Schemes) { [void]$PrefixSet.Add($s.Prefix) }

# Canonical names: "canonical | avoid, forms". A form marked "(alias...)" is skipped; "(alias: x)" marks x.
$AvoidForms = [System.Collections.Generic.List[object]]::new()
if ($Blocks.ContainsKey('vocab-canonical')) {
    foreach ($l in (Split-Lines $Blocks['vocab-canonical'])) {
        if ($l -notmatch '^\s*(.+?)\s*\|\s*(.*?)\s*$') { continue }
        $canon = $Matches[1]
        foreach ($part in (Split-Flow ($Matches[2] -replace '[\[\]{}]', ''))) {
            $form = $part; $note = $null
            if ($part -match '^(.*?)\s*\((.*)\)\s*$') { $form = $Matches[1]; $note = $Matches[2] }
            if ($note -and $note -match '^\s*alias\b' -and $note -notmatch '^\s*alias\s*:') { continue }
            $form = $form.Trim(); if (-not $form) { continue }
            $pat = '(?<![\p{L}\p{N}])' + ([regex]::Escape($form) -replace '\\ ', '\s+') + 's?(?![\p{L}\p{N}])'
            # A quoted phrase in the note, as in IAPT (say "formerly IAPT" once), is allowed once per page.
            $allowRx = $null
            if ($note -and $note -match '"([^"]+)"') {
                $allowPat = '(?<![\p{L}\p{N}])' + ([regex]::Escape($Matches[1]) -replace '\\ ', '\s+') + '(?![\p{L}\p{N}])'
                $allowRx = [regex]::new($allowPat, 'IgnoreCase, CultureInvariant')
            }
            $AvoidForms.Add([pscustomobject]@{ Form = $form; Canonical = $canon; Rx = [regex]::new($pat, 'IgnoreCase, CultureInvariant'); Allow = $allowRx })
        }
    }
}
elseif ($schemaText) { Add-Issue STRUCTURE '_schema.md' "missing fenced block 'vocab-canonical'" }

# Numbered sections
$SchemaSec = @{}
$secMatches = [regex]::Matches($schemaText, '(?m)^## (\d+)\.')
for ($i = 0; $i -lt $secMatches.Count; $i++) {
    $start = $secMatches[$i].Index
    $stop = if ($i + 1 -lt $secMatches.Count) { $secMatches[$i + 1].Index } else { $schemaText.Length }
    $SchemaSec[[int]$secMatches[$i].Groups[1].Value] = $schemaText.Substring($start, $stop - $start)
}

# Section 4: frontmatter key order and kinds (scalar | flow | block)
$FmKeys = [System.Collections.Generic.List[string]]::new()
$FmKind = New-Dict
if ($SchemaSec.ContainsKey(4) -and $SchemaSec[4] -match '(?ms)^```yaml[ \t]*\r?\n(.*?)^```') {
    foreach ($l in (Split-Lines $Matches[1])) {
        if ($l -cmatch '^([a-z_]+):(?:\s+(.*))?$') {
            $v = ([string]$Matches[2]).Trim()
            $FmKeys.Add($Matches[1])
            $FmKind[$Matches[1]] = if ($v -eq '') { 'block' } elseif ($v.StartsWith('[')) { 'flow' } else { 'scalar' }
        }
    }
}
if ($FmKeys.Count -eq 0 -and $schemaText) { Add-Issue STRUCTURE '_schema.md' 'section 4 has no yaml frontmatter example; frontmatter keys cannot be checked' }
$FmKeySet = New-StrSet; foreach ($k in $FmKeys) { [void]$FmKeySet.Add($k) }

# Section 7: body headings per page type
$Templates = New-Dict
if ($SchemaSec.ContainsKey(7)) {
    $curType = $null; $buf = ''
    $flush = { if ($curType) { $Templates[$curType] = [string[]]@([regex]::Matches($buf, '`## ([^`]+)`') | ForEach-Object { $_.Groups[1].Value.Trim() }) } }
    foreach ($l in (Split-Lines $SchemaSec[7])) {
        if ($l -cmatch '^- \*\*([a-z-]+)\*\*:(.*)$') { . $flush; $curType = $Matches[1]; $buf = $Matches[2] }
        elseif ($curType -and $l -match '^\s+\S') { $buf += ' ' + $l }
        else { . $flush; $curType = $null; $buf = '' }
    }
    . $flush
}
foreach ($t in $TypeSet) { if (-not $Templates.ContainsKey($t)) { Add-Issue STRUCTURE '_schema.md' "section 7 has no heading template for page type '$t'" } }

# Section 8: index headings
function Get-BacktickHeadings([string]$Text) { return , [string[]]@([regex]::Matches($Text, '`## ([^`]+)`') | ForEach-Object { $_.Groups[1].Value.Trim() }) }
$DomainHeadings = @(); $LeafHeadings = @(); $RouterHeadings = @()
if ($SchemaSec.ContainsKey(8)) {
    $s8 = $SchemaSec[8]
    if ($s8 -match '(?ms)^```markdown[ \t]*\r?\n(.*?)^```') { $DomainHeadings = [string[]]@([regex]::Matches($Matches[1], '(?m)^## (.+?)\s*$') | ForEach-Object { $_.Groups[1].Value.Trim() }) }
    if ($s8 -match '(?ms)^\*\*Leaf.*?(?=\r?\n[ \t]*\r?\n|\z)') { $LeafHeadings = Get-BacktickHeadings $Matches[0] }
    if ($s8 -match '(?ms)^\*\*Router.*?(?=\r?\n[ \t]*\r?\n|\z)') { $RouterHeadings = Get-BacktickHeadings $Matches[0] }
}
if ($schemaText) {
    if ($DomainHeadings.Count -eq 0) { Add-Issue STRUCTURE '_schema.md' 'section 8 domain index format not found' }
    if ($LeafHeadings.Count -eq 0) { Add-Issue STRUCTURE '_schema.md' 'section 8 leaf index format not found' }
    if ($RouterHeadings.Count -eq 0) { Add-Issue STRUCTURE '_schema.md' 'section 8 router index format not found' }
}

# ---------------------------------------------------------------------------------------------------
# 2. Top-level files, sources
# ---------------------------------------------------------------------------------------------------
foreach ($f in $RequiredTopFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $Root $f) -PathType Leaf)) { Add-Issue STRUCTURE $f 'required top-level file is missing' }
}

$Sources = New-Dict   # key -> [pscustomobject]@{Citation; Kind; Access}
$sourcesPath = Join-Path $Root '_sources.md'
if (Test-Path -LiteralPath $sourcesPath -PathType Leaf) {
    foreach ($l in (Split-Lines (Read-Text $sourcesPath))) {
        if ($l -notmatch '^\s*\|') { continue }
        $cells = Split-Row $l
        if ($cells.Count -lt 1) { continue }
        $k = ($cells[0] -replace '`', '').Trim()
        if ($k -eq '' -or $k -ceq 'Key' -or $k -match '^:?-+:?$') { continue }
        if (-not $Sources.ContainsKey($k)) {
            $Sources[$k] = [pscustomobject]@{ Citation = (Get-Cell $cells 1); Kind = (Get-Cell $cells 2); Access = (Get-Cell $cells 3) }
        }
    }
}

# ---------------------------------------------------------------------------------------------------
# 3. Domains, containers, leaves, page files
# ---------------------------------------------------------------------------------------------------
$Domains = [System.Collections.Generic.List[object]]::new()
$DomainByRouter = New-Dict
function New-Domain($Dir, [string]$RouterName, [string]$Kind) {
    $d = [pscustomobject]@{ Name = $Dir.Name; RouterName = $RouterName; Path = $Dir.FullName; Kind = $Kind; Title = $null
        Pages = [System.Collections.Generic.List[object]]::new(); PageById = (New-Dict) }
    $Domains.Add($d); $DomainByRouter[$RouterName] = $d
}
$nnDirs = @(Get-ChildItem -LiteralPath $Root -Directory | Where-Object { $_.Name -cmatch '^\d{2}-' } | Sort-Object Name)
foreach ($dir in $nnDirs) {
    $rel = Get-Rel $dir.FullName
    if ($dir.Name -cnotmatch '^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$') { Add-Issue STRUCTURE $rel 'folder name must be NN-slug (lowercase letters, digits, hyphens)' }
    if (Test-Path -LiteralPath (Join-Path $dir.FullName '_index.md') -PathType Leaf) { New-Domain $dir $dir.Name 'domain'; continue }
    $files = @(Get-ChildItem -LiteralPath $dir.FullName -File)
    $subs = @(Get-ChildItem -LiteralPath $dir.FullName -Directory | Sort-Object Name)
    if ($files.Count -gt 0) {
        Add-Issue STRUCTURE $rel ("has no _index.md but holds files (" + (($files | ForEach-Object Name) -join ', ') + "): a domain needs _index.md and a container holds only leaf folders")
    }
    if ($files.Count -eq 0 -and $subs.Count -eq 0) { Add-Issue STRUCTURE $rel 'empty folder: neither a domain (no _index.md) nor a container (no leaf folders)' }
    foreach ($s in $subs) {
        $srel = Get-Rel $s.FullName
        if ($s.Name -cnotmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$') { Add-Issue STRUCTURE $srel 'leaf folder name must be lowercase letters, digits and hyphens' }
        if (Test-Path -LiteralPath (Join-Path $s.FullName '_index.md') -PathType Leaf) { New-Domain $s "$($dir.Name)/$($s.Name)" 'leaf' }
        else { Add-Issue STRUCTURE $srel 'leaf folder in a container has no _index.md' }
    }
}

$AllPages = [System.Collections.Generic.List[object]]::new()
$PageById = New-Dict
foreach ($d in $Domains) {
    foreach ($s in @(Get-ChildItem -LiteralPath $d.Path -Directory)) { Add-Issue STRUCTURE (Get-Rel $s.FullName) 'subfolder inside a domain: only containers hold folders' }
    foreach ($f in @(Get-ChildItem -LiteralPath $d.Path -File | Sort-Object Name)) {
        if ($f.Name -ceq '_index.md') { continue }
        $frel = Get-Rel $f.FullName
        if ($f.Extension -cne '.md') { Add-Issue STRUCTURE $frel 'not a Markdown page: a domain holds only _index.md and .md pages'; continue }
        if ($f.Name -cnotmatch '^[a-z0-9]+(?:-[a-z0-9]+)*\.md$') { Add-Issue STRUCTURE $frel 'file name must be lowercase letters, digits and hyphens, ending .md' }
        $stem = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
        $text = Read-Text $f.FullName
        $lines = Split-Lines $text
        $pg = [pscustomobject]@{
            Path = $f.FullName; Rel = $frel; RelFwd = ($frel -replace '\\', '/'); Folder = $d.Name; Stem = $stem
            Id = "$($d.Name).$stem"; IsPitfall = $stem.StartsWith('pitfall-'); Domain = $d
            Text = $text; Lines = $lines; Fm = (Read-Frontmatter $lines); Body = ''; IndexRow = $null
        }
        if ($pg.Fm.Ok) {
            $start = $pg.Fm.End + 1
            $pg.Body = if ($start -lt $lines.Count) { [string]::Join("`n", $lines, $start, $lines.Count - $start) } else { '' }
        }
        else { $pg.Body = $text }
        if ($PageById.ContainsKey($pg.Id)) { Add-Issue STRUCTURE $frel "page id '$($pg.Id)' is also the id of $($PageById[$pg.Id].Rel) (leaf folder names must be unique)" }
        else { $PageById[$pg.Id] = $pg }
        $d.Pages.Add($pg); $d.PageById[$pg.Id] = $pg
        $AllPages.Add($pg)
    }
}

# ---------------------------------------------------------------------------------------------------
# 4. Folder indexes and router
# ---------------------------------------------------------------------------------------------------
foreach ($d in $Domains) {
    $idxPath = Join-Path $d.Path '_index.md'
    $idxRel = Get-Rel $idxPath
    $md = Read-Markdown (Read-Text $idxPath)
    if ($null -eq $md.H1) { Add-Issue STRUCTURE $idxRel "missing H1 '# $($d.RouterName): Title'" }
    elseif ($md.H1 -cmatch ('^' + [regex]::Escape($d.RouterName) + ':\s+(\S.*)$')) { $d.Title = $Matches[1].Trim() }
    else { Add-Issue STRUCTURE $idxRel "H1 must read '# $($d.RouterName): Title'" ; $d.Title = $md.H1 }
    $req = if ($d.Kind -eq 'domain') { $DomainHeadings } else { $LeafHeadings }
    Test-HeadingOrder $md.Headings $req STRUCTURE $idxRel

    $count = [System.Collections.Generic.Dictionary[string, int]]::new($Ord)
    foreach ($spec in @(@{ Sec = 'Pages'; Pit = $false; Sum = 'Summary' }, @{ Sec = 'Pitfalls'; Pit = $true; Sum = 'Symptom' })) {
        if (-not $md.Sections.ContainsKey($spec.Sec)) { continue }
        $tables = Get-Tables $md.Sections[$spec.Sec]
        if ($tables.Count -eq 0) { continue }
        $tb = $tables[0]
        $ci = Get-Col $tb.Header 'Page'
        if ($ci -lt 0) { Add-Issue STRUCTURE $idxRel "## $($spec.Sec) table has no 'Page' column"; continue }
        $si = Get-Col $tb.Header $spec.Sum; $ai = Get-Col $tb.Header 'Applies when'; $di = Get-Col $tb.Header 'Depth'
        foreach ($row in $tb.Rows) {
            $id = Get-CellId ([string](Get-Cell $row $ci))
            $p = $null
            if (-not $d.PageById.TryGetValue($id, [ref]$p)) { Add-Issue STRUCTURE $idxRel "## $($spec.Sec) row names '$id', which is not a page in this folder"; continue }
            if ($p.IsPitfall -ne $spec.Pit) {
                $want = if ($p.IsPitfall) { 'Pitfalls' } else { 'Pages' }
                Add-Issue STRUCTURE $idxRel "'$id' is listed under ## $($spec.Sec) but belongs under ## $want"
                continue
            }
            $c = 0; [void]$count.TryGetValue($id, [ref]$c); $count[$id] = $c + 1
            if ($c -eq 0) {
                $p.IndexRow = [pscustomobject]@{ Index = $idxRel; Table = $spec.Sec; SumCol = $spec.Sum
                    Summary = (Get-Cell $row $si); Applies = (Get-Cell $row $ai); Depth = (Get-Cell $row $di); HasApplies = ($ai -ge 0); HasDepth = ($di -ge 0) }
            }
        }
    }
    foreach ($p in $d.Pages) {
        $c = 0; [void]$count.TryGetValue($p.Id, [ref]$c)
        $want = if ($p.IsPitfall) { 'Pitfalls' } else { 'Pages' }
        if ($c -eq 0) { Add-Issue STRUCTURE $idxRel "page '$($p.Id)' ($($p.Stem).md) is not listed in the ## $want table" }
        elseif ($c -gt 1) { Add-Issue STRUCTURE $idxRel "page '$($p.Id)' is listed $c times in the ## $want table" }
    }
}

$routerPath = Join-Path $Root '_index.md'
if (Test-Path -LiteralPath $routerPath -PathType Leaf) {
    $md = Read-Markdown (Read-Text $routerPath)
    Test-HeadingOrder $md.Headings $RouterHeadings STRUCTURE '_index.md'
    $seen = [System.Collections.Generic.Dictionary[string, int]]::new($Ord)
    if ($md.Sections.ContainsKey('Domains')) {
        $tables = Get-Tables $md.Sections['Domains']
        if ($tables.Count -eq 0) { Add-Issue STRUCTURE '_index.md' '## Domains has no table' }
        else {
            foreach ($row in $tables[0].Rows) {
                $cell = [string](Get-Cell $row 0)
                $name = $null
                if ($cell -match '\[([^\]]*)\]\(\s*<?([^)>\s]+)>?(?:\s+"[^"]*")?\s*\)') {
                    $t = [uri]::UnescapeDataString($Matches[2]) -replace '\\', '/'
                    $t = $t -replace '#.*$', '' -replace '^\./', '' -replace '/?_index\.md$', ''
                    $name = $t.TrimEnd('/')
                }
                else {
                    Add-Issue STRUCTURE '_index.md' "## Domains row '$cell' is not a link"
                    $name = (Get-CellId $cell).TrimEnd('/')
                }
                if ($DomainByRouter.ContainsKey($name)) { $c = 0; [void]$seen.TryGetValue($name, [ref]$c); $seen[$name] = $c + 1 }
                else { Add-Issue STRUCTURE '_index.md' "## Domains row links '$name', which is not a domain or leaf folder" }
            }
        }
    }
    foreach ($d in $Domains) {
        $c = 0; [void]$seen.TryGetValue($d.RouterName, [ref]$c)
        if ($c -eq 0) { Add-Issue STRUCTURE '_index.md' "## Domains table has no row for '$($d.RouterName)'" }
        elseif ($c -gt 1) { Add-Issue STRUCTURE '_index.md' "## Domains table lists '$($d.RouterName)' $c times" }
    }
}

# ---------------------------------------------------------------------------------------------------
# 5. Vocabulary layer
# ---------------------------------------------------------------------------------------------------
$VocabIds = New-Dict        # id -> [pscustomobject]@{Prefix; Rel; Kind; Obj}
$SchemeData = [System.Collections.Generic.List[object]]::new()
$FailedPrefixes = New-StrSet
$nConcepts = 0; $nModels = 0
foreach ($s in $Schemes) {
    $path = Join-Path (Join-Path $Root '_vocab') $s.File
    $rel = Get-Rel $path
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { Add-Issue VOCAB $rel "scheme file listed in vocab-schemes is missing"; [void]$FailedPrefixes.Add($s.Prefix); continue }
    $text = Read-Text $path
    try { ([System.Text.Json.JsonDocument]::Parse($text)).Dispose(); $obj = $text | ConvertFrom-Json -DateKind String -Depth 100 }
    catch { Add-Issue VOCAB $rel ("does not parse as JSON: " + ($_.Exception.Message -replace '\s+', ' ')); [void]$FailedPrefixes.Add($s.Prefix); continue }
    if ($obj -isnot [System.Management.Automation.PSCustomObject]) { Add-Issue VOCAB $rel 'top level must be a JSON object'; [void]$FailedPrefixes.Add($s.Prefix); continue }
    $stemName = [System.IO.Path]::GetFileNameWithoutExtension($s.File)
    if ([string](Get-P $obj 'prefix') -cne $s.Prefix) { Add-Issue VOCAB $rel "prefix '$(Get-P $obj 'prefix')' does not match '$($s.Prefix)' from vocab-schemes" }
    if ([string](Get-P $obj 'scheme') -cne $stemName) { Add-Issue VOCAB $rel "scheme '$(Get-P $obj 'scheme')' does not match the file name '$stemName'" }
    $isModels = Test-HasP $obj 'models'
    $sd = [pscustomobject]@{ Prefix = $s.Prefix; File = $s.File; Path = $path; Rel = $rel; Obj = $obj; Text = $text; IsModels = $isModels }
    $SchemeData.Add($sd)
    $idRx = '^' + [regex]::Escape($s.Prefix) + '\.[a-z0-9]+(?:-[a-z0-9]+)*$'
    $list = if ($isModels) { Get-Arr $obj 'models' } else { Get-Arr $obj 'concepts' }
    if (-not $isModels -and -not (Test-HasP $obj 'concepts')) { Add-Issue VOCAB $rel "has no 'concepts' array" }
    foreach ($c in $list) {
        $id = Get-P $c 'id'
        if ($id -isnot [string] -or -not $id) { Add-Issue VOCAB $rel "an entry has no string 'id'"; continue }
        if ($id -cnotmatch $idRx) { Add-Issue VOCAB $rel "id '$id' must be '$($s.Prefix).<slug>' (lowercase letters, digits, hyphens)" }
        if ($VocabIds.ContainsKey($id)) { Add-Issue VOCAB $rel "id '$id' is already defined in $($VocabIds[$id].Rel)"; continue }
        $VocabIds[$id] = [pscustomobject]@{ Prefix = $s.Prefix; Rel = $rel; Kind = $(if ($isModels) { 'model' } else { 'concept' }); Obj = $c }
        if ($isModels) { $nModels++ } else {
            $nConcepts++
            foreach ($req in 'label', 'definition') { if (-not [string](Get-P $c $req)) { Add-Issue VOCAB $rel "concept '$id' has no '$req'" } }
        }
    }
}
$havePages = $AllPages.Count -gt 0
foreach ($sd in $SchemeData) {
    $rel = $sd.Rel
    if (-not $sd.IsModels) {
        foreach ($c in (Get-Arr $sd.Obj 'concepts')) {
            $id = [string](Get-P $c 'id'); if (-not $id) { continue }
            $b = Get-P $c 'broader'
            if ($null -ne $b) {
                if ($b -isnot [string] -or -not $VocabIds.ContainsKey($b)) { Add-Issue VOCAB $rel "concept '$id' broader '$b' is not an existing id" }
                elseif ($VocabIds[$b].Prefix -cne $sd.Prefix -or $VocabIds[$b].Kind -ne 'concept') { Add-Issue VOCAB $rel "concept '$id' broader '$b' is not in the same scheme" }
                elseif ($b -ceq $id) { Add-Issue VOCAB $rel "concept '$id' is broader than itself" }
            }
            foreach ($r in (Get-Arr $c 'related')) { if ($r -isnot [string] -or -not $VocabIds.ContainsKey($r)) { Add-Issue VOCAB $rel "concept '$id' related '$r' is not an existing id" } }
            $rb = Get-P $c 'replaced_by'
            if ($null -ne $rb -and ($rb -isnot [string] -or -not $VocabIds.ContainsKey($rb))) { Add-Issue VOCAB $rel "concept '$id' replaced_by '$rb' is not an existing id" }
        }
        continue
    }
    $ratingKeys = New-StrSet
    $rt = Get-P $sd.Obj 'rating_types'
    if ($rt -is [System.Management.Automation.PSCustomObject]) { foreach ($p in $rt.PSObject.Properties) { [void]$ratingKeys.Add($p.Name) } }
    else { Add-Issue VOCAB $rel "'rating_types' must be an object" }
    foreach ($m in (Get-Arr $sd.Obj 'models')) {
        $mid = [string](Get-P $m 'id')
        $grid = Get-P $m 'grid'
        $cols = Get-P $grid 'cols'; $rows = Get-P $grid 'rows'
        $gridOk = (Test-IsInt $cols) -and (Test-IsInt $rows) -and $cols -ge 1 -and $rows -ge 1
        if (-not $gridOk) { Add-Issue VOCAB $rel "model '$mid' grid must have integer cols and rows of at least 1" }
        $slotIds = New-StrSet
        foreach ($sl in (Get-Arr $m 'slots')) {
            $sid = [string](Get-P $sl 'id')
            if (-not $sid) { Add-Issue VOCAB $rel "model '$mid' has a slot without an id"; continue }
            if (-not $slotIds.Add($sid)) { Add-Issue VOCAB $rel "model '$mid' slot id '$sid' is not unique" }
            foreach ($vp in (Get-Arr $sl 'vocab')) { if ($vp -isnot [string] -or -not $PrefixSet.Contains($vp)) { Add-Issue VOCAB $rel "model '$mid' slot '$sid' vocab prefix '$vp' is not in vocab-schemes" } }
            $rating = Get-P $sl 'rating'
            if ($null -ne $rating -and ($rating -isnot [string] -or -not $ratingKeys.Contains($rating))) { Add-Issue VOCAB $rel "model '$mid' slot '$sid' rating '$rating' is not a key of rating_types" }
            $col = Get-P $sl 'col'; $row = Get-P $sl 'row'
            if (-not (Test-IsInt $col) -or -not (Test-IsInt $row)) { Add-Issue VOCAB $rel "model '$mid' slot '$sid' needs integer col and row" }
            elseif ($gridOk -and ($col -lt 1 -or $col -gt $cols -or $row -lt 1 -or $row -gt $rows)) { Add-Issue VOCAB $rel "model '$mid' slot '$sid' at col $col, row $row is outside the $cols x $rows grid" }
        }
        foreach ($ln in (Get-Arr $m 'links')) {
            foreach ($end in 'from', 'to') {
                $v = [string](Get-P $ln $end)
                if (-not $slotIds.Contains($v)) { Add-Issue VOCAB $rel "model '$mid' link $end '$v' is not a slot id" }
            }
            $st = Get-P $ln 'style'
            if ($null -ne $st -and $st -cne 'solid' -and $st -cne 'dashed') { Add-Issue VOCAB $rel "model '$mid' link style '$st' must be solid or dashed" }
        }
        $mp = Get-P $m 'page'
        if ($havePages -and $null -ne $mp -and -not $PageById.ContainsKey([string]$mp)) { Add-Issue VOCAB $rel "model '$mid' page '$mp' is not an existing page id" }
    }
}

# ---------------------------------------------------------------------------------------------------
# 6. Pages
# ---------------------------------------------------------------------------------------------------
function Get-FirstLine([string]$Text, [string]$Needle) {
    $i = $Text.IndexOf($Needle, [StringComparison]::Ordinal)
    if ($i -lt 0) { return 0 }
    return ([regex]::Matches($Text.Substring(0, $i), "`n").Count + 1)
}
foreach ($pg in $AllPages) {
    $rel = $pg.Rel
    foreach ($ch in @(@($EmDash, 'em dash (U+2014)'), @($MidDot, 'middle dot (U+00B7)'))) {
        $n = ($pg.Text.Length - $pg.Text.Replace($ch[0], '').Length)
        if ($n -gt 0) { Add-Issue PAGE $rel "contains $n $($ch[1]) character(s), first on line $(Get-FirstLine $pg.Text $ch[0])" }
    }
    $fm = $pg.Fm
    if (-not $fm.Ok) { Add-Issue PAGE $rel $fm.Error; continue }
    foreach ($e in $fm.Errors) { Add-Issue PAGE $rel "frontmatter $e" }

    # keys: known, required, order, kinds
    foreach ($k in $fm.Order) { if (-not $FmKeySet.Contains($k)) { Add-Issue PAGE $rel "unknown frontmatter key '$k'" } }
    foreach ($k in $FmKeys) { if (-not $fm.Entries.ContainsKey($k)) { Add-Issue PAGE $rel "missing required frontmatter key '$k'" } }
    $seq = @($fm.Order | Where-Object { $FmKeySet.Contains($_) })
    $exp = @($FmKeys | Where-Object { $fm.Entries.ContainsKey($_) })
    if (($seq -join ',') -cne ($exp -join ',')) { Add-Issue PAGE $rel "frontmatter keys are out of order: expected $($FmKeys -join ', ')" }
    foreach ($k in $fm.Order) {
        if (-not $FmKind.ContainsKey($k)) { continue }
        $e = $fm.Entries[$k]; $want = $FmKind[$k]
        switch ($want) {
            'scalar' {
                if ($e.Kind -eq 'empty') { Add-Issue PAGE $rel "'$k' has no value" }
                elseif ($e.Kind -ne 'scalar') { Add-Issue PAGE $rel "'$k' must be a single-line scalar" }
                elseif ($e.Scalar.Bad) { Add-Issue PAGE $rel "'$k' has an unterminated double quote" }
                elseif ($e.Scalar.NeedsQuote) { Add-Issue PAGE $rel "'$k' value contains ': ' or ' #' or starts with a reserved character, so it must be double-quoted" }
            }
            'flow' { if ($e.Kind -ne 'flow') { Add-Issue PAGE $rel "'$k' must be a flow list on one line, like [a, b]" } }
            'block' {
                if ($e.Kind -eq 'flow' -and $e.Items.Count -eq 0) { }
                elseif ($e.Kind -ne 'block' -and $e.Kind -ne 'empty') { Add-Issue PAGE $rel "'$k' must be a block list of '  - item' lines" }
                foreach ($it in $e.Items) {
                    if ($it.Bad) { Add-Issue PAGE $rel "'$k' item is malformed: $($it.Value)" }
                    elseif ($it.NeedsQuote) { Add-Issue PAGE $rel "'$k' item contains ': ' or ' #' or starts with a reserved character, so it must be double-quoted: $($it.Value)" }
                }
            }
        }
    }

    # values
    $idv = Get-FmScalar $fm 'id'
    if ($null -ne $idv -and $idv -cne $pg.Id) { Add-Issue PAGE $rel "id '$idv' must be '$($pg.Id)' (<folder>.<file>)" }
    $type = Get-FmScalar $fm 'type'
    if ($null -ne $type) {
        if (-not $TypeSet.Contains($type)) { Add-Issue PAGE $rel "type '$type' is not in vocab-type" }
        if ($pg.IsPitfall -and $type -cne 'pitfall') { Add-Issue PAGE $rel "pitfall-*.md file must have type 'pitfall', not '$type'" }
        if (-not $pg.IsPitfall -and $type -ceq 'pitfall') { Add-Issue PAGE $rel "type 'pitfall' requires a file name starting 'pitfall-'" }
    }
    $depth = Get-FmScalar $fm 'depth'
    if ($null -ne $depth -and -not $DepthSet.Contains($depth)) { Add-Issue PAGE $rel "depth '$depth' is not in vocab-depth" }
    foreach ($pair in @(@('stage', $StageSet, 'vocab-stage'), @('topics', $TopicSet, 'vocab-topics'))) {
        if (-not $fm.Entries.ContainsKey($pair[0])) { continue }
        $items = Get-FmItems $fm $pair[0]
        if ($items.Count -eq 0 -and $fm.Entries[$pair[0]].Kind -eq 'flow') { Add-Issue PAGE $rel "'$($pair[0])' is empty" }
        foreach ($it in $items) { if (-not $pair[1].Contains($it.Value)) { Add-Issue PAGE $rel "$($pair[0]) value '$($it.Value)' is not in $($pair[2])" } }
    }
    $summary = Get-FmScalar $fm 'summary'
    if ($summary) { $sw = Get-WordCount $summary; if ($sw -gt $MaxSummaryWords) { Add-Issue PAGE $rel "summary has $sw words (maximum $MaxSummaryWords)" } }
    $reviewed = Get-FmScalar $fm 'reviewed'
    if ($null -ne $reviewed) {
        $dt = [datetime]::MinValue
        if ($reviewed -cnotmatch '^\d{4}-\d{2}-\d{2}$' -or -not [datetime]::TryParseExact($reviewed, 'yyyy-MM-dd', [cultureinfo]::InvariantCulture, 'None', [ref]$dt)) {
            Add-Issue PAGE $rel "reviewed '$reviewed' is not an ISO date (YYYY-MM-DD)"
        }
    }
    $pageKeys = New-StrSet
    foreach ($it in (Get-FmItems $fm 'sources')) {
        if ($it.IsMap) { Add-Issue PAGE $rel "sources entry must be '<Key> $SectionSign <locator>', not a map"; continue }
        $m = $SourceEntryRx.Match($it.Value)
        if (-not $m.Success) { Add-Issue PAGE $rel "sources entry '$($it.Value)' does not match '<Key> $SectionSign <locator>'"; continue }
        $key = $m.Groups['key'].Value
        [void]$pageKeys.Add($key)
        if (-not $MaintainerRx.IsMatch($key) -and -not $Sources.ContainsKey($key)) { Add-Issue PAGE $rel "source key '$key' is not in _sources.md" }
    }
    foreach ($it in (Get-FmItems $fm 'related')) {
        if (-not $it.IsMap -or $it.Map.Count -ne 2 -or -not $it.Map.Contains('id') -or -not $it.Map.Contains('rel')) {
            Add-Issue PAGE $rel "related item '$($it.Value)' must be {id: <page-id>, rel: <rel>}"; continue
        }
        $rid = [string]$it.Map['id']; $rrel = [string]$it.Map['rel']
        if (-not $RelSet.Contains($rrel)) { Add-Issue PAGE $rel "related rel '$rrel' is not in vocab-rel" }
        if (-not $PageById.ContainsKey($rid)) { Add-Issue PAGE $rel "related id '$rid' is not an existing page" }
        elseif ($rid -ceq $pg.Id) { Add-Issue PAGE $rel 'related points to the page itself' }
    }
    foreach ($it in (Get-FmItems $fm 'concepts')) {
        $cid = $it.Value
        if ($VocabIds.ContainsKey($cid)) { continue }
        $pfx = ($cid -split '\.', 2)[0]
        if ($FailedPrefixes.Contains($pfx)) { continue }
        Add-Issue PAGE $rel "concept '$cid' is not defined in _vocab"
    }

    # body
    $bodyLines = Split-Lines $pg.Body
    $first = $null
    foreach ($l in $bodyLines) { if ($l.Trim() -ne '') { $first = $l; break } }
    if ($null -eq $first -or -not $first.StartsWith('**Bottom line:**')) { Add-Issue PAGE $rel "body must start with a line beginning '**Bottom line:**'" }
    $wc = Get-WordCount $pg.Body
    if ($wc -lt $MinBodyWords) { Add-Issue PAGE $rel "body has $wc words (minimum $MinBodyWords)" }
    elseif ($wc -gt $MaxBodyWords) { Add-Issue PAGE $rel "body has $wc words (maximum $MaxBodyWords)" }
    if ($type -and $Templates.ContainsKey($type)) {
        $found = [System.Collections.Generic.List[string]]::new(); $inFence = $false
        foreach ($l in $bodyLines) {
            if ($l -match '^\s*(```|~~~)') { $inFence = -not $inFence; continue }
            if (-not $inFence -and $l -cmatch '^## (.+?)\s*#*\s*$') { $found.Add($Matches[1].Trim()) }
        }
        Test-HeadingOrder $found $Templates[$type] PAGE $rel
    }
    $scan = $CodeSpanRx.Replace($pg.Body, '')
    $reported = New-StrSet
    foreach ($bm in $BracketRx.Matches($scan)) {
        foreach ($part in ($bm.Groups[1].Value -split '[;,]')) {
            $tok = ($part.Trim() -split '\s+', 2)[0]
            if (-not $InlineKeyRx.IsMatch($tok)) { continue }
            if (-not $pageKeys.Contains($tok) -and $reported.Add($tok)) { Add-Issue PAGE $rel "inline citation [$tok] is not in this page's sources" }
        }
    }
    if ($pg.IndexRow) {
        $ir = $pg.IndexRow
        if ($null -ne $summary -and (Format-Ws $ir.Summary) -cne (Format-Ws $summary)) { Add-Issue PAGE $rel "$($ir.SumCol) in $($ir.Index) is not the frontmatter summary copied verbatim" }
        $aw = Get-FmScalar $fm 'applies_when'
        if ($ir.HasApplies -and $null -ne $aw -and (Format-Ws $ir.Applies) -cne (Format-Ws $aw)) { Add-Issue PAGE $rel "Applies when in $($ir.Index) is not the frontmatter applies_when copied verbatim" }
        if ($ir.HasDepth -and $null -ne $depth -and (Format-Ws $ir.Depth) -cne $depth) { Add-Issue PAGE $rel "Depth '$($ir.Depth)' in $($ir.Index) differs from frontmatter depth '$depth'" }
    }

    # style warnings
    foreach ($af in $AvoidForms) {
        $styleBody = $pg.Body
        if ($af.Allow) { $styleBody = $af.Allow.Replace($styleBody, ' ', 1) }
        $ms = $af.Rx.Matches($styleBody)
        if ($ms.Count -gt 0) { Add-Issue STYLE $rel "uses '$($ms[0].Value)' ($($ms.Count)x): canonical form is '$($af.Canonical)' (avoid '$($af.Form)')" }
    }
}

# ---------------------------------------------------------------------------------------------------
# 7. Generated files (-WriteCatalog)
# ---------------------------------------------------------------------------------------------------
function Update-SeeArrays([string]$Text, $SeeMap) {
    $toks = $JsonTokRx.Matches($Text)
    $n = $toks.Count
    $val = [string[]]::new($n)
    for ($i = 0; $i -lt $n; $i++) { $val[$i] = $toks[$i].Value }
    $match = [int[]]::new($n)
    $stack = [System.Collections.Generic.Stack[int]]::new()
    for ($i = 0; $i -lt $n; $i++) {
        $v = $val[$i]
        if ($v -ceq '{' -or $v -ceq '[') { $stack.Push($i) }
        elseif ($v -ceq '}' -or $v -ceq ']') { $o = $stack.Pop(); $match[$o] = $i; $match[$i] = $o }
    }
    $getProps = {
        param([int]$at)
        $props = [System.Collections.Generic.List[object]]::new()
        $j = $at + 1; $close = $match[$at]
        while ($j -lt $close) {
            $k = $val[$j].Substring(1, $val[$j].Length - 2)
            $vs = $j + 2
            $ve = if ($val[$vs] -ceq '{' -or $val[$vs] -ceq '[') { $match[$vs] } else { $vs }
            $props.Add([pscustomobject]@{ Key = $k; KeyTok = $j; VS = $vs; VE = $ve })
            $j = $ve + 1
            if ($j -lt $close -and $val[$j] -ceq ',') { $j++ }
        }
        return , $props
    }
    if ($n -eq 0 -or $val[0] -cne '{') { return $Text }
    $edits = [System.Collections.Generic.List[object]]::new()
    $nl = if ($Text.Contains("`r`n")) { "`r`n" } else { "`n" }
    $conceptsProp = (& $getProps 0) | Where-Object { $_.Key -ceq 'concepts' } | Select-Object -First 1
    if (-not $conceptsProp -or $val[$conceptsProp.VS] -cne '[') { return $Text }
    $j = $conceptsProp.VS + 1; $end = $match[$conceptsProp.VS]
    while ($j -lt $end) {
        if ($val[$j] -ceq '{') {
            $props = & $getProps $j
            $idp = $props | Where-Object { $_.Key -ceq 'id' } | Select-Object -First 1
            if ($idp) {
                $cid = $val[$idp.VS].Trim('"')
                $want = @(); $set = $null
                if ($SeeMap.TryGetValue($cid, [ref]$set)) { $want = @($set) }
                $newText = if ($want.Count -eq 0) { '[]' } else { '[' + (($want | ForEach-Object { '"' + $_ + '"' }) -join ', ') + ']' }
                $seep = $props | Where-Object { $_.Key -ceq 'see' } | Select-Object -First 1
                if ($seep) {
                    $cur = @(); for ($q = $seep.VS + 1; $q -lt $seep.VE; $q++) { if ($val[$q].StartsWith('"')) { $cur += $val[$q].Trim('"') } }
                    if ($val[$seep.VS] -cne '[' -or ($cur -join "`n") -cne ($want -join "`n")) {
                        $s0 = $toks[$seep.VS].Index; $e0 = $toks[$seep.VE].Index + $toks[$seep.VE].Length
                        $edits.Add([pscustomobject]@{ Start = $s0; Len = $e0 - $s0; Text = $newText })
                    }
                }
                else {
                    $after = $props | Where-Object { $_.Key -ceq 'related' } | Select-Object -First 1
                    if (-not $after) { $after = $props[$props.Count - 1] }
                    $firstKey = $toks[$props[0].KeyTok].Index
                    $ls = $Text.LastIndexOf("`n", [Math]::Max(0, $firstKey - 1)) + 1
                    $indent = $Text.Substring($ls, $firstKey - $ls)
                    if ($indent.Trim() -ne '') { $indent = '' }
                    $pos = $toks[$after.VE].Index + $toks[$after.VE].Length
                    $edits.Add([pscustomobject]@{ Start = $pos; Len = 0; Text = ",$nl$indent`"see`": $newText" })
                }
            }
            $j = $match[$j] + 1
        }
        else { $j++ }
    }
    if ($edits.Count -eq 0) { return $Text }
    $sb = [System.Text.StringBuilder]::new($Text)
    foreach ($ed in ($edits | Sort-Object Start -Descending)) { [void]$sb.Remove($ed.Start, $ed.Len); [void]$sb.Insert($ed.Start, $ed.Text) }
    return $sb.ToString()
}

if ($WriteCatalog) {
    $sortedPages = @($AllPages | Sort-Object RelFwd)

    # _catalog.yaml
    $y = [System.Collections.Generic.List[string]]::new()
    $y.Add('# Generated by _tools/validate.ps1 -WriteCatalog. Do not edit by hand.')
    $y.Add("# generated: $Today")
    foreach ($pg in $sortedPages) {
        $y.Add('- file: ' + (Format-YamlScalar $pg.RelFwd))
        if (-not $pg.Fm.Ok) { continue }
        foreach ($k in $pg.Fm.Order) {
            $e = $pg.Fm.Entries[$k]
            switch ($e.Kind) {
                'scalar' { $y.Add("  ${k}: " + (Format-YamlScalar $e.Scalar.Value)) }
                'map' { $y.Add("  ${k}: " + $e.Scalar.Value) }
                'flow' { $y.Add("  ${k}: [" + (($e.Items | ForEach-Object { Format-YamlScalar $_.Value }) -join ', ') + ']') }
                default {
                    if ($e.Items.Count -eq 0) { $y.Add("  ${k}: []") }
                    else {
                        $y.Add("  ${k}:")
                        foreach ($it in $e.Items) {
                            if ($it.IsMap) { $y.Add('    - {' + (($it.Map.GetEnumerator() | ForEach-Object { "$($_.Key): $(Format-YamlScalar ([string]$_.Value))" }) -join ', ') + '}') }
                            else { $y.Add('    - ' + (Format-YamlScalar $it.Value)) }
                        }
                    }
                }
            }
        }
    }
    Write-IfChanged (Join-Path $Root '_catalog.yaml') (($y -join "`n") + "`n")

    # _graph.json
    $nodes = [System.Collections.Generic.List[object]]::new()
    $edges = [System.Collections.Generic.List[object]]::new()
    $edgeSeen = New-StrSet
    $addEdge = { param($f, $t, $r) if ($edgeSeen.Add("$f`t$t`t$r")) { $edges.Add([ordered]@{ from = $f; to = $t; rel = $r }) } }
    foreach ($d in $Domains) { $nodes.Add([ordered]@{ id = $d.RouterName; kind = 'domain'; label = $(if ($d.Title) { $d.Title } else { $d.RouterName }); domain_kind = $d.Kind; path = ($(Get-Rel $d.Path) -replace '\\', '/') }) }
    foreach ($pg in $sortedPages) {
        $fm = $pg.Fm
        $nodes.Add([ordered]@{ id = $pg.Id; kind = 'page'; label = [string](Get-FmScalar $fm 'title'); type = [string](Get-FmScalar $fm 'type')
                depth = [string](Get-FmScalar $fm 'depth'); domain = $pg.Domain.RouterName; file = $pg.RelFwd; summary = [string](Get-FmScalar $fm 'summary')
                stage = [string[]]@((Get-FmItems $fm 'stage') | ForEach-Object Value); topics = [string[]]@((Get-FmItems $fm 'topics') | ForEach-Object Value) })
        & $addEdge $pg.Id $pg.Domain.RouterName 'in-domain'
        foreach ($it in (Get-FmItems $fm 'related')) {
            if ($it.IsMap -and $PageById.ContainsKey([string]$it.Map['id']) -and $RelSet.Contains([string]$it.Map['rel'])) { & $addEdge $pg.Id ([string]$it.Map['id']) ([string]$it.Map['rel']) }
        }
        foreach ($it in (Get-FmItems $fm 'concepts')) { if ($VocabIds.ContainsKey($it.Value)) { & $addEdge $pg.Id $it.Value 'tags' } }
        foreach ($it in (Get-FmItems $fm 'sources')) {
            $m = $SourceEntryRx.Match([string]$it.Value)
            if ($m.Success -and $Sources.ContainsKey($m.Groups['key'].Value)) { & $addEdge $pg.Id $m.Groups['key'].Value 'cites' }
        }
    }
    foreach ($sd in $SchemeData) {
        $title = [string](Get-P $sd.Obj 'title')
        if ($sd.IsModels) {
            foreach ($m in (Get-Arr $sd.Obj 'models')) {
                $mid = [string](Get-P $m 'id'); if (-not $mid) { continue }
                $nodes.Add([ordered]@{ id = $mid; kind = 'model'; label = [string](Get-P $m 'label'); page = (Get-P $m 'page') })
                foreach ($sl in (Get-Arr $m 'slots')) { foreach ($vp in (Get-Arr $sl 'vocab')) { if ($PrefixSet.Contains([string]$vp)) { & $addEdge $mid ([string]$vp) 'slot-uses' } } }
            }
            continue
        }
        foreach ($c in (Get-Arr $sd.Obj 'concepts')) {
            $cid = [string](Get-P $c 'id'); if (-not $cid) { continue }
            $node = [ordered]@{ id = $cid; kind = 'concept'; label = [string](Get-P $c 'label'); scheme = $sd.Prefix; scheme_title = $title }
            if ((Get-P $c 'deprecated') -eq $true) { $node.deprecated = $true }
            $nodes.Add($node)
            $b = Get-P $c 'broader'
            if ($b -is [string] -and $VocabIds.ContainsKey($b)) { & $addEdge $cid $b 'broader' }
            foreach ($r in (Get-Arr $c 'related')) { if ($r -is [string] -and $VocabIds.ContainsKey($r)) { & $addEdge $cid $r 'concept-related' } }
        }
    }
    foreach ($k in ($Sources.Keys | Sort-Object)) {
        $s = $Sources[$k]
        $nodes.Add([ordered]@{ id = $k; kind = 'source'; label = [string]$s.Citation; source_kind = [string]$s.Kind; access = [string]$s.Access })
    }
    $graph = [ordered]@{ generated = $Today; nodes = $nodes.ToArray(); edges = $edges.ToArray() }
    $json = ($graph | ConvertTo-Json -Depth 10) -replace "`r`n", "`n"
    Write-IfChanged (Join-Path $Root '_graph.json') ($json + "`n")

    # _vocab see arrays
    $seeMap = [System.Collections.Generic.Dictionary[string, object]]::new($Ord)
    foreach ($pg in $sortedPages) {
        foreach ($it in (Get-FmItems $pg.Fm 'concepts')) {
            if (-not $VocabIds.ContainsKey($it.Value)) { continue }
            if (-not $seeMap.ContainsKey($it.Value)) { $seeMap[$it.Value] = [System.Collections.Generic.SortedSet[string]]::new($Ord) }
            [void]$seeMap[$it.Value].Add($pg.Id)
        }
    }
    foreach ($sd in $SchemeData) {
        if ($sd.IsModels) { continue }
        $newText = Update-SeeArrays $sd.Text $seeMap
        if ($newText -cne $sd.Text) { [System.IO.File]::WriteAllText($sd.Path, $newText, $Utf8) }
    }

    # _glossary.md controlled-vocabulary block
    $gPath = Join-Path $Root '_glossary.md'
    if (Test-Path -LiteralPath $gPath -PathType Leaf) {
        $g = Read-Text $gPath
        $bi = $g.IndexOf($GlossaryBegin, [StringComparison]::Ordinal)
        $ei = if ($bi -ge 0) { $g.IndexOf($GlossaryEnd, $bi + $GlossaryBegin.Length, [StringComparison]::Ordinal) } else { -1 }
        if ($bi -lt 0 -or $ei -lt 0) { Add-Issue STRUCTURE '_glossary.md' "cannot regenerate: markers '$GlossaryBegin' and '$GlossaryEnd' not found in order" }
        else {
            $nl = if ($g.Contains("`r`n")) { "`r`n" } else { "`n" }
            $cellFix = { param($s) ((Format-Ws ([string]$s)) -replace '\|', '\|') }
            $out = [System.Collections.Generic.List[string]]::new()
            foreach ($sd in $SchemeData) {
                if ($sd.IsModels) { continue }
                $rows = @((Get-Arr $sd.Obj 'concepts') | Where-Object { (Get-P $_ 'deprecated') -ne $true -and (Get-P $_ 'id') })
                if ($rows.Count -eq 0) { continue }
                $title = [string](Get-P $sd.Obj 'title'); if (-not $title) { $title = [string](Get-P $sd.Obj 'scheme') }
                $out.Add(''); $out.Add("#### $title"); $out.Add('')
                $out.Add('| Label | Definition | Concept |'); $out.Add('|---|---|---|')
                foreach ($c in $rows) { $out.Add('| ' + (& $cellFix (Get-P $c 'label')) + ' | ' + (& $cellFix (Get-P $c 'definition')) + ' | `' + (Get-P $c 'id') + '` |') }
            }
            $out.Add('')
            $middle = $nl + ($out -join $nl) + $nl
            $newG = $g.Substring(0, $bi + $GlossaryBegin.Length) + $middle + $g.Substring($ei)
            if ($newG -cne $g) { [System.IO.File]::WriteAllText($gPath, $newG, $Utf8) }
        }
    }
}

# ---------------------------------------------------------------------------------------------------
# 8. Report
# ---------------------------------------------------------------------------------------------------
$nPit = @($AllPages | Where-Object IsPitfall).Count
$nPages = $AllPages.Count - $nPit
$stdout = [Console]::Out
foreach ($cat in $Issues.Keys) { foreach ($line in $Issues[$cat]) { $stdout.WriteLine($line) } }
$stdout.WriteLine("domains: $($Domains.Count)  pages: $nPages  pitfalls: $nPit  concepts: $nConcepts  models: $nModels  sources: $($Sources.Count)")
$stdout.WriteLine("structure issues: $($Issues.STRUCTURE.Count)")
$stdout.WriteLine("page issues: $($Issues.PAGE.Count)")
$stdout.WriteLine("vocab issues: $($Issues.VOCAB.Count)")
$stdout.WriteLine("style warnings: $($Issues.STYLE.Count)")
$stdout.Flush()
if ($Issues.STRUCTURE.Count -gt 0 -or $Issues.VOCAB.Count -gt 0) { exit 1 }
exit 0
