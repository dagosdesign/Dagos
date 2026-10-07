# Lexistencehub - imzali Android App Bundle (.aab) uretir.
# Calistirmak icin proje klasorundeki "android-release.bat" dosyasina cift tikla.
$ErrorActionPreference = 'Stop'

$root    = Split-Path -Parent $PSScriptRoot
$android = Join-Path $root 'android'
$props   = Join-Path $android 'keystore.properties'

# The upload key Play Console knows (it signed version 1). Never create another one:
# Play rejects a bundle signed with any other key.
$jks     = 'C:\Users\osman\Documents\lex\lexistencehub'
$alias   = 'upload'
$expectedSha256 = '70:A1:1C:DA:38:E7:5C:BA:9E:F3:FC:98:41:99:6C:96:29:20:95:4D:6D:80:F5:65:5B:6F:6E:47:7E:A5:70:7F'

function Say($t, $c = 'Cyan') { Write-Host ""; Write-Host "==> $t" -ForegroundColor $c }
function Read-Secret($prompt) {
    $s = Read-Host -AsSecureString $prompt
    [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}

# 1) Java (Android Studio'nun kendi JDK'si)
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $candidates = @(
        "$env:ProgramFiles\Android\Android Studio\jbr",
        "$env:LOCALAPPDATA\Programs\Android Studio\jbr",
        "${env:ProgramFiles(x86)}\Android\Android Studio\jbr"
    ) + (Get-ChildItem "$env:USERPROFILE\.jdks" -Directory -ErrorAction SilentlyContinue | ForEach-Object FullName)
    $env:JAVA_HOME = $candidates | Where-Object { $_ -and (Test-Path (Join-Path $_ 'bin\java.exe')) } | Select-Object -First 1
    if (-not $env:JAVA_HOME) { throw "Java bulunamadi. Android Studio kurulu mu?" }
}
$keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
Say "Java: $env:JAVA_HOME"

# 2) Imza anahtari: sifre sadece ilk seferde sorulur ve android\keystore.properties'e
#    yazilir (bu dosya git'e gitmez). Sifre ekrana ve komut satirina yazilmaz.
if (-not (Test-Path $props)) {
    if (-not (Test-Path $jks)) {
        throw "Imza anahtari bulunamadi: $jks`nBu dosya olmadan Play'e guncelleme yuklenemez. Yedeginden ayni yere geri koy."
    }
    Say "Imza anahtari: $jks" 'Yellow'
    Write-Host "Android Studio'da ilk AAB'yi olustururken belirledigin anahtar sifresini gir."
    Write-Host "(Yazarken ekranda gorunmez; yazip Enter'a bas.)"
    $ErrorActionPreference = 'Continue'   # keytool yanlis sifrede stderr'e yazar; bu bir hata degil
    while ($true) {
        $pw = Read-Secret "Sifre"
        $env:LEX_KS_PW = $pw
        $out = & $keytool -list -v -keystore $jks -alias $alias -storepass:env LEX_KS_PW 2>&1 | Out-String
        $ok = ($LASTEXITCODE -eq 0)
        $env:LEX_KS_PW = $null
        if ($ok -and $out.Contains($expectedSha256)) { break }
        if ($ok) { throw "Bu anahtar, Play'e yuklenen ilk surumu imzalayan anahtar degil." }
        Write-Host "Sifre yanlis, tekrar dene. (Vazgecmek icin pencereyi kapat.)" -ForegroundColor Red
    }
    $ErrorActionPreference = 'Stop'
    $content = "storeFile=$($jks -replace '\\','/')`nstorePassword=$pw`nkeyAlias=$alias`nkeyPassword=$pw`n"
    [IO.File]::WriteAllText($props, $content, (New-Object Text.UTF8Encoding($false)))
    $pw = $null
    Say "Sifre dogru. android\keystore.properties yazildi (git'e gitmez); bir daha sorulmayacak." 'Green'
}

# 3) Web kismini derle ve native projeye kopyala
Say "Web derlemesi (npm run build:native)"
Push-Location $root
try { npm run build:native; if ($LASTEXITCODE -ne 0) { throw "build:native basarisiz." } } finally { Pop-Location }

# 4) Imzali AAB
Say "Android App Bundle derleniyor (gradlew bundleRelease) - ilk seferde birkac dakika surer"
Push-Location $android
try { & .\gradlew.bat bundleRelease; if ($LASTEXITCODE -ne 0) { throw "Gradle derlemesi basarisiz." } } finally { Pop-Location }

$aab = Join-Path $android 'app\build\outputs\bundle\release\app-release.aab'
if (-not (Test-Path $aab)) { throw "AAB bulunamadi: $aab" }

$gradle = Get-Content (Join-Path $android 'app\build.gradle') -Raw
$vc = [regex]::Match($gradle, 'versionCode\s+(\d+)').Groups[1].Value
$vn = [regex]::Match($gradle, 'versionName\s+"([^"]+)"').Groups[1].Value
$outDir = Join-Path $root 'release'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$final = Join-Path $outDir "lexistencehub-v$vn-vc$vc.aab"
Copy-Item $aab $final -Force

# Imza kontrolu: yeni AAB, Play'in tanidigi anahtarla mi imzali?
$cert = & $keytool -printcert -jarfile $final 2>&1 | Out-String
if (-not $cert.Contains($expectedSha256)) {
    throw "AAB beklenen anahtarla imzalanmamis. Play Console bunu reddeder; yukleme."
}
Say "Imza dogru: Play'e yuklenen ilk surumle ayni anahtar." 'Green'

Say "HAZIR: $final" 'Green'
Write-Host "versionName $vn / versionCode $vc"
Write-Host "Bu dosyayi Play Console > Dahili test > Yeni surum olustur'a yukle."
Write-Host "Bir sonraki yuklemede android\app\build.gradle icindeki versionCode'u 1 artir."
Write-Host "Yedegin var mi? $jks + sifre (USB + bulut)."
Start-Process explorer.exe $outDir
