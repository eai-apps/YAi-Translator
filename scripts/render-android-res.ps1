Add-Type -AssemblyName System.Drawing

$root = Resolve-Path "$PSScriptRoot\.."
$src512 = Join-Path $root "public\icons\icon-512.png"
$srcMask = Join-Path $root "public\icons\icon-maskable-512.png"
$resDir = Join-Path $root "android\app\src\main\res"

if (-not (Test-Path $src512)) {
    Write-Error "Source icon not found: $src512"
    exit 1
}

function Resize-Image($srcPath, $dstPath, $width, $height) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $dstImg = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dstImg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $width, $height)
    $g.Dispose()
    $srcImg.Dispose()
    
    $dstDir = Split-Path $dstPath -Parent
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    $dstImg.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dstImg.Dispose()
    Write-Host "Created: $dstPath ($width x $height)"
}

function Create-TvBanner($srcPath, $dstPath) {
    $width = 320
    $height = 180
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $dstImg = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dstImg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Фон баннера — фирменный тёмно-синий/графитовый #151a23
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#151a23")
    $g.Clear($bgColor)
    
    # Рисуем логотип по центру с высотой 130px
    $logoSize = 130
    $x = ($width - $logoSize) / 2
    $y = ($height - $logoSize) / 2
    $g.DrawImage($srcImg, $x, $y, $logoSize, $logoSize)
    
    $g.Dispose()
    $srcImg.Dispose()
    
    $dstDir = Split-Path $dstPath -Parent
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    $dstImg.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dstImg.Dispose()
    Write-Host "Created TV Banner: $dstPath ($width x $height)"
}

# Генерация иконок для всех разрешений mipmap
$densities = @(
    @{ Name = "mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "xxxhdpi"; Size = 192; FgSize = 432 }
)

foreach ($d in $densities) {
    $folder = Join-Path $resDir "mipmap-$($d.Name)"
    Resize-Image $src512 (Join-Path $folder "ic_launcher.png") $d.Size $d.Size
    Resize-Image $src512 (Join-Path $folder "ic_launcher_round.png") $d.Size $d.Size
    Resize-Image $srcMask (Join-Path $folder "ic_launcher_foreground.png") $d.FgSize $d.FgSize
}

# Генерация TV баннера
Create-TvBanner $src512 (Join-Path $resDir "drawable\tv_banner.png")
Create-TvBanner $src512 (Join-Path $resDir "drawable-xhdpi\tv_banner.png")
