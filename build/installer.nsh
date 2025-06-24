; Custom NSIS installer script for Forge MOI

!macro customInit
  ; Custom initialization code
!macroend

!macro customInstall
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\Forge MOI.lnk" "$INSTDIR\Forge MOI.exe"
  
  ; Add to PATH (optional)
  ; EnVar::AddValue "PATH" "$INSTDIR"
!macroend

!macro customUnInstall
  ; Remove desktop shortcut
  Delete "$DESKTOP\Forge MOI.lnk"
  
  ; Remove from PATH (if added)
  ; EnVar::DeleteValue "PATH" "$INSTDIR"
!macroend