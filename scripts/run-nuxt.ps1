param(
    [Parameter(Mandatory = $true)]
    [string] $Command,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $CommandArgs
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$linkRoot = Join-Path $env:TEMP "network-3.0-build"
$copyRoot = Join-Path $env:TEMP "network-3.0-build-copy"

function Invoke-Robocopy {
    param(
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    & robocopy @Arguments | Out-Host

    if ($LASTEXITCODE -gt 7) {
        exit $LASTEXITCODE
    }
}

function Repair-NuxtKitWindowsIgnore {
    $kitPath = Join-Path $repoRoot "node_modules\@nuxt\kit\dist\index.mjs"

    if (-not (Test-Path $kitPath)) {
        return
    }

    $content = Get-Content -LiteralPath $kitPath -Raw
    $needle = "function isIgnored(pathname) {`n  const nuxt = tryUseNuxt();"
    $replacement = "function isIgnored(pathname) {`n  pathname = normalize(pathname);`n  const nuxt = tryUseNuxt();"

    if (-not $content.Contains($replacement)) {
        if (-not $content.Contains($needle)) {
            return
        }

        $content = $content.Replace($needle, $replacement)
    }

    $content = $content.Replace(
        "const cwds = nuxt.options._layers?.map((layer2) => layer2.cwd).sort((a, b) => b.length - a.length);",
        "const cwds = nuxt.options._layers?.map((layer2) => normalize(layer2.cwd)).sort((a, b) => b.length - a.length);"
    )
    $content = $content.Replace(
        "const relativePath = relative(layer ?? nuxt.options.rootDir, pathname);",
        "const relativePath = relative(layer ?? normalize(nuxt.options.rootDir), pathname);"
    )
    $content = $content.Replace(
        'if (relativePath[0] === "." && relativePath[1] === ".") {' + "`n    return false;`n  }",
        'if ((relativePath[0] === "." && relativePath[1] === ".") || isAbsolute(relativePath)) {' + "`n    return false;`n  }"
    )

    Set-Content -LiteralPath $kitPath -Value $content -NoNewline
}

try {
    $env:DEBUG = ""

    # Running dev from the temporary junction breaks Vite's module graph on this project.
    # Use the real repository path for all Nuxt commands.
    $mappedRoot = $repoRoot

    $nodePath = Join-Path $mappedRoot "node_modules\node\bin\node.exe"
    $nuxiPath = Join-Path $mappedRoot "node_modules\nuxi\bin\nuxi.mjs"

    if (-not (Test-Path $nodePath)) {
        $nodePath = "node"
    }

    if (-not (Test-Path $nuxiPath)) {
        throw "nuxi was not found at $nuxiPath"
    }

    Repair-NuxtKitWindowsIgnore

    $quotedArgs = @($nuxiPath, $Command) + $CommandArgs | ForEach-Object {
        '"' + ($_ -replace '"', '\"') + '"'
    }
    $cmdLine = 'cd /d "' + $mappedRoot + '" && "' + $nodePath + '" ' + ($quotedArgs -join " ")

    & cmd.exe /d /c $cmdLine
    $commandExitCode = $LASTEXITCODE

    exit $commandExitCode
}
finally {
}
