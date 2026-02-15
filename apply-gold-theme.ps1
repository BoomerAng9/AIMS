## apply-gold-theme.ps1
## Replaces all amber color references with gold/wireframe design tokens
## across 19 dashboard page files.

$base = "c:\Users\rishj\OneDrive\Desktop\A.I.M.S\frontend\app\dashboard"

$files = @(
    "$base\luc\page.tsx",
    "$base\acheevy\page.tsx",
    "$base\admin\page.tsx",
    "$base\boomerangs\page.tsx",
    "$base\circuit-box\page.tsx",
    "$base\environments\page.tsx",
    "$base\gates\page.tsx",
    "$base\house-of-ang\page.tsx",
    "$base\lab\page.tsx",
    "$base\model-garden\page.tsx",
    "$base\operations\page.tsx",
    "$base\plan\page.tsx",
    "$base\security\page.tsx",
    "$base\sports-tracker\page.tsx",
    "$base\your-space\page.tsx",
    "$base\make-it-mine\page.tsx",
    "$base\make-it-mine\diy\page.tsx",
    "$base\plugs\[id]\page.tsx",
    "$base\project-management\page.tsx"
)

# Ordered replacements - most specific patterns first to avoid partial matches
$replacements = [ordered]@{
    # Text classes (most specific first)
    "text-amber-200/90"  = "text-white/80"
    "text-amber-200/70"  = "text-gold"
    "text-amber-200/60"  = "text-gold"
    "text-amber-200/50"  = "text-gold/50"
    "text-amber-200"     = "text-gold"
    "text-amber-100/90"  = "text-white/70"
    "text-amber-100/80"  = "text-white/70"
    "text-amber-100/70"  = "text-white/50"
    "text-amber-100/60"  = "text-white/50"
    "text-amber-100/50"  = "text-white/40"
    "text-amber-100/40"  = "text-white/30"
    "text-amber-100/30"  = "text-white/20"
    "text-amber-100/20"  = "text-white/20"
    "text-amber-100"     = "text-white/50"
    "text-amber-400/60"  = "text-gold"
    "text-amber-400"     = "text-gold"
    "text-amber-300/80"  = "text-gold"
    "text-amber-300/70"  = "text-gold"
    "text-amber-300/60"  = "text-gold"
    "text-amber-300/40"  = "text-gold"
    "text-amber-300"     = "text-gold"
    "text-amber-50/80"   = "text-white"
    "text-amber-50/70"   = "text-white"
    "text-amber-50/60"   = "text-white/50"
    "text-amber-50"      = "text-white"

    # Background classes
    "bg-amber-500/20"  = "bg-gold/10"
    "bg-amber-500/10"  = "bg-gold/10"
    "bg-amber-400/20"  = "bg-gold/10"
    "bg-amber-400/10"  = "bg-gold/10"
    "bg-amber-400/5"   = "bg-gold/10"
    "bg-amber-300/20"  = "bg-gold/10"
    "bg-amber-300/10"  = "bg-gold/10"
    "bg-amber-300/5"   = "bg-gold/10"
    "bg-amber-400"     = "bg-gold"
    "bg-amber-300"     = "bg-gold"

    # Border classes
    "border-amber-500/40" = "border-gold/30"
    "border-amber-500/30" = "border-gold/30"
    "border-amber-400/30" = "border-gold/30"
    "border-amber-400/20" = "border-gold/20"
    "border-amber-400/10" = "border-gold/20"
    "border-amber-300/50" = "border-gold/30"
    "border-amber-300/40" = "border-gold/30"
    "border-amber-300/30" = "border-gold/20"
    "border-amber-300/20" = "border-gold/20"
    "border-amber-300/10" = "border-gold/20"
    "border-white/10"     = "border-wireframe-stroke"
    "border-white/5"      = "border-wireframe-stroke"

    # Hover background
    "hover:bg-amber-400/10"  = "hover:bg-gold-light"
    "hover:bg-amber-300/20"  = "hover:bg-gold-light"
    "hover:bg-amber-300/15"  = "hover:bg-gold-light"
    "hover:bg-amber-300/10"  = "hover:bg-gold-light"
    "hover:bg-amber-300"     = "hover:bg-gold-light"
    "hover:bg-amber-500/30"  = "hover:bg-gold-light"

    # Hover text
    "hover:text-amber-200" = "hover:text-gold"
    "hover:text-amber-300" = "hover:text-gold"
    "hover:text-amber-100/60" = "hover:text-gold"
    "hover:text-amber-100" = "hover:text-gold"
    "hover:text-amber-50"  = "hover:text-gold"
    "hover:text-amber-400" = "hover:text-gold"

    # Hover border
    "hover:border-amber-400/40" = "hover:border-gold/20"
    "hover:border-amber-400/20" = "hover:border-gold/20"
    "hover:border-amber-300/30" = "hover:border-gold/20"
    "hover:border-amber-300/20" = "hover:border-gold/20"
    "hover:border-amber-300/40" = "hover:border-gold/20"
    "hover:border-amber-500/50" = "hover:border-gold/20"

    # Focus
    "focus:border-amber-500"    = "focus:border-gold/30"
    "focus:border-amber-300/50" = "focus:border-gold/30"
    "focus:border-amber-300"    = "focus:border-gold/30"

    # Gradients
    "from-amber-400/20"  = "from-gold/20"
    "from-amber-400/10"  = "from-gold/10"
    "from-amber-400/5"   = "from-gold/10"
    "from-amber-400"     = "from-gold"
    "from-amber-600/10"  = "from-gold/10"
    "to-amber-600/10"    = "to-gold/10"
    "to-amber-300"       = "to-gold"
    "to-amber-950/10"    = "to-gold/10"

    # Group hover
    "group-hover:bg-amber-300" = "group-hover:bg-gold"
    "group-hover:bg-amber-400" = "group-hover:bg-gold"

    # Other
    "border-t-amber-400" = "border-t-gold"
    "bg-[#0a0f1a]"      = "bg-[#0A0A0A]"
}

$totalChanges = 0
$filesChanged = 0

foreach ($filePath in $files) {
    if (-not (Test-Path $filePath)) {
        Write-Host "SKIP (not found): $filePath"
        continue
    }

    $content = Get-Content $filePath -Raw
    $original = $content
    $fileChanges = 0

    foreach ($key in $replacements.Keys) {
        $val = $replacements[$key]
        if ($content.Contains($key)) {
            $count = ([regex]::Matches($content, [regex]::Escape($key))).Count
            $content = $content.Replace($key, $val)
            $fileChanges += $count
            Write-Host "  $key -> $val  ($count occurrences)"
        }
    }

    if ($fileChanges -gt 0) {
        Set-Content -Path $filePath -Value $content -NoNewline
        $totalChanges += $fileChanges
        $filesChanged++
        Write-Host "UPDATED ($fileChanges changes): $filePath"
    } else {
        Write-Host "NO CHANGES: $filePath"
    }
    Write-Host ""
}

Write-Host "=============================="
Write-Host "Done! $totalChanges total replacements across $filesChanged files."
