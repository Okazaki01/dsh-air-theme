# make-preview.ps1 - generate the two skin-preview images the DSH Desktop
# "Settings -> Skin" card loads from <skin>/preview/light.png and dark.png
# (see dsh-skin-switch: GET /api/dsh-skins/preview/<rowId>/<light|dark>).
# Pure System.Drawing, no external dependency. ASCII-only source on purpose.
Add-Type -AssemblyName System.Drawing

$pkgRoot = Split-Path -Parent $PSScriptRoot
$out = Join-Path $pkgRoot 'preview'
New-Item -ItemType Directory -Force $out | Out-Null

$W = 1280; $H = 720
$bgPath = Join-Path $pkgRoot 'assets\bg.jpg'
$mascotPath = Join-Path $pkgRoot 'assets\misuzu.png'

$bg = [System.Drawing.Image]::FromFile($bgPath)
$mascot = [System.Drawing.Image]::FromFile($mascotPath)

function New-RoundedPath($x, $y, $w, $h, $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Add-RoundedRect($g, $brush, $x, $y, $w, $h, $r) {
  $path = New-RoundedPath $x $y $w $h $r
  $g.FillPath($brush, $path)
  $path.Dispose()
}

# aspect-fill the background into W x H
$scale = [Math]::Max($W / $bg.Width, $H / $bg.Height)
$dw = [int]($bg.Width * $scale); $dh = [int]($bg.Height * $scale)
$dx = [int](($W - $dw) / 2); $dy = [int](($H - $dh) / 2)

foreach ($mode in @('light', 'dark')) {
  $bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($bg, $dx, $dy, $dw, $dh)

  if ($mode -eq 'light') {
    $overlay     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 226, 242, 255))
    $sidebar     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 245, 251, 255))
    $panel       = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 252, 254, 255))
    $bubble      = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(205, 246, 214, 232))
    $bubbleInk   = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 46, 88, 132))
    $ink         = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 26, 54, 92))
    $navBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 222, 241, 253))
    $titleBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 138, 198, 240))
    $edgePen     = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 120, 190, 235), 2)
  } else {
    $overlay     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 9, 26, 46))
    $sidebar     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(185, 14, 34, 60))
    $panel       = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 18, 44, 74))
    $bubble      = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 92, 44, 78))
    $bubbleInk   = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 198, 224, 250))
    $ink         = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 240, 255))
    $navBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 26, 54, 92))
    $titleBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 24, 62, 104))
    $edgePen     = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 96, 156, 214), 2)
  }
  $g.FillRectangle($overlay, 0, 0, $W, $H)

  # window title strip
  $g.FillRectangle($titleBrush, 0, 0, $W, 44)

  # sidebar + gold brand pill + nav capsules
  $g.FillRectangle($sidebar, 0, 44, 248, $H - 44)
  $goldPill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, 255, 236, 190))
  Add-RoundedRect $g $goldPill 10 58 218 40 14
  $goldPill.Dispose()
  $goldInk = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 196, 148, 38))
  $goldFont = New-Object System.Drawing.Font('Yu Gothic UI', 15, [System.Drawing.FontStyle]::Bold)
  $g.DrawString('deepseek  HARNESS', $goldFont, $goldInk, 24, 67)
  $goldFont.Dispose(); $goldInk.Dispose()

  Add-RoundedRect $g $navBrush 10 112 218 30 15
  Add-RoundedRect $g $navBrush 10 170 218 32 16
  Add-RoundedRect $g $navBrush 10 214 218 32 16
  $sakura = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 247, 184, 207))
  $g.FillEllipse($sakura, 24, 178, 10, 10)
  $g.FillEllipse($sakura, 24, 222, 10, 10)
  $sakura.Dispose()

  # assistant bubble
  Add-RoundedRect $g $bubble 330 92 560 84 20
  $bubbleFont = New-Object System.Drawing.Font('Yu Gothic UI', 15)
  $g.DrawString('Kamisoriyo Misuzu to issho ni, aoi sora e...', $bubbleFont, $bubbleInk, 358, 118)
  $bubbleFont.Dispose()

  # composer card + gold corners
  $card = New-RoundedPath 300 428 620 118 24
  $g.FillPath($panel, $card)
  $g.DrawPath($edgePen, $card)
  $card.Dispose()
  $cornerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 240, 200))
  foreach ($cx in @(300, 920)) { foreach ($cy in @(428, 546)) { $g.FillEllipse($cornerBrush, $cx - 9, $cy - 9, 18, 18) } }
  $cornerBrush.Dispose()
  $hint = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(175, 130, 180, 220))
  $hintFont = New-Object System.Drawing.Font('Segoe Script', 13, [System.Drawing.FontStyle]::Bold)
  $g.DrawString('It is time to steal the tokens again...', $hintFont, $hint, 332, 472)
  $hintFont.Dispose(); $hint.Dispose()

  # mascot bottom-right, faded like the in-app silhouette
  $mw = 300
  $mh = [int]($mascot.Height * $mw / $mascot.Width)
  $g.DrawImage($mascot, $W - $mw - 18, $H - $mh + 34, $mw, $mh)

  # header text
  $font = New-Object System.Drawing.Font('Yu Gothic UI', 16, [System.Drawing.FontStyle]::Bold)
  $g.DrawString('AIR - Summer Sky  -  DeepSeek Harness', $font, $ink, 22, 9)
  $font.Dispose()

  $target = Join-Path $out ($mode + '.png')
  $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)

  $overlay.Dispose(); $sidebar.Dispose(); $panel.Dispose(); $bubble.Dispose()
  $bubbleInk.Dispose(); $ink.Dispose(); $navBrush.Dispose(); $titleBrush.Dispose(); $edgePen.Dispose()
  $g.Dispose(); $bmp.Dispose()
  Write-Output ("{0} saved ({1} bytes)" -f $target, (Get-Item $target).Length)
}
$bg.Dispose(); $mascot.Dispose()
