 = "E:\MP\Box\xiaohongshu-ai-generator\assets\js"
 = @("app.js","generator.js","ui.js","templates.js","content-analyzer.js","content-optimizer.js","prompt-engine.js","premium-prompt-engine.js","premium-card-generator.js","advanced-image-generator.js","visual-generator.js","preview-system.js","performance-optimizer.js")

foreach ( in ) {
     = Join-Path  
    if (Test-Path ) {
         = [System.IO.File]::ReadAllText(, [System.Text.Encoding]::UTF8)
         = 
         =  -replace "console\.log\(", "DEBUG.log("
         =  -replace "console\.error\(", "DEBUG.error("
         =  -replace "console\.warn\(", "DEBUG.warn("
        if ( -ne ) {
            [System.IO.File]::WriteAllText(, , [System.Text.Encoding]::UTF8)
            Write-Host "Updated: "
        } else {
            Write-Host "No changes: "
        }
    } else {
        Write-Host "NOT FOUND: "
    }
}
