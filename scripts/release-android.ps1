# Lexistencehub - imzali Android App Bundle (.aab) uretir.
# Calistirmak icin proje klasorundeki "android-release.bat" dosyasina cift tikla.
$ErrorActionPreference = 'Stop'

$root    = Split-Path -Parent $PSScriptRoot
$android = Join-Path $root 'android'
$props   = Join-Path $android 'keystore.properties'
$keyDir  = 'C:\LexisKeys'
$jks     = Join-Path $keyDir 'lexistencehub-upload.jks'

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

# 2) Imza anahtari (keystore) - sadece ilk seferde
if (-not (Test-Path $props)) {
    New-Item -ItemType Directory -Force -Path $keyDir | Out-Null
    if (Test-Path $jks) {
        Say "Mevcut anahtar bulundu: $jks" 'Yellow'
        $pw = Read-Secret "Bu anahtarin sifresini gir"
    } else {
        Say "Yeni imza anahtari olusturuluyor: $jks" 'Yellow'
        Write-Host "Sifre en az 8 karakter olsun; ters egik cizgi (\) kullanma."
        Write-Host "BU SIFREYI VE ANAHTAR DOSYASINI KAYBEDERSEN UYGULAMAYI GUNCELLEYEMEZSIN."
        do {
            $pw  = Read-Secret "Sifre"
            $pw2 = Read-Secret "Sifre (tekrar)"
            if ($pw -ne $pw2) { Write-Host "Sifreler ayni degil, tekrar dene." -ForegroundColor Red }
            elseif ($pw.Length -lt 8) { Write-Host "En az 8 karakter olmali." -ForegroundColor Red }
        } while ($pw -ne $pw2 -or $pw.Length -lt 8)
        $name = Read-Host "Adin Soyadin (sertifikada gorunur)"
        & $keytool -genkeypair -v -keystore $jks -storetype PKCS12 -keyalg RSA -keysize 2048 `
            -validity 10000 -alias upload -storepass $pw -keypass $pw -dname "CN=$name, O=Lexistencehub, C=TR"
        if ($LASTEXITCODE -ne 0) { throw "Anahtar olusturulamadi." }
    }
    $content = "storeFile=$($jks -replace '\\','/')`nstorePassword=$pw`nkeyAlias=upload`nkeyPassword=$pw`n"
    [IO.File]::WriteAllText($props, $content, (New-Object Text.UTF8Encoding($false)))
    Say "android\keystore.properties yazildi (git'e gitmez)." 'Green'
}

# 3) Web kismini derle ve native projeye kopyala
Say "Web derlemesi (npm run build:native)"
Push-Location $root
try { npm run build:native; if ($LASTEXITCODE -ne 0) { throw "build:native basarisiz." } } finally { Pop-Location }

# 4) Imzali AAB
Say "Android App Bundle derleniyor (gradlew bundleRelease)"
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

# Imza kontrolu
$jarsigner = Join-Path $env:JAVA_HOME 'bin\jarsigner.exe'
if (Test-Path $jarsigner) { & $jarsigner -verify $final | Select-Object -Last 1 }

Say "HAZIR: $final" 'Green'
Write-Host "versionName $vn / versionCode $vc"
Write-Host "Bir sonraki yuklemede android\app\build.gradle icindeki versionCode'u 1 artir."
Write-Host "Yedekle: $jks + sifre (USB + bulut)."
Start-Process explorer.exe $outDir
